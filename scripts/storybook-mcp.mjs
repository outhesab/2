#!/usr/bin/env node
/**
 * Storybook MCP Server for PARSPEL Audit
 *
 * Wraps Storybook functionality as MCP-compatible tools.
 * Protocol: stdio (JSON-RPC 2.0 over stdin/stdout)
 */

import { createInterface } from 'node:readline';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { globSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const AUDIT_STATE_PATH = join(process.cwd(), '.opencode', 'memory', 'audit-state.json');

let storybookProcess = null;
let serverPort = 6006;

// JSON-RPC handler
const rl = createInterface({ input: process.stdin });

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    const response = await handleRequest(request);
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (err) {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32700, message: err.message },
      id: null,
    }) + '\n');
  }
});

async function handleRequest(req) {
  const { method, params, id } = req;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'storybook-mcp', version: '1.0.0' },
        },
        id,
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        result: {
          tools: [
            {
              name: 'storybook_list_components',
              description: 'List all Storybook stories/components and their status.',
              inputSchema: {
                type: 'object',
                properties: {
                  filter: { type: 'string', description: 'Optional filter by title (e.g. "UI/")' },
                },
              },
            },
            {
              name: 'storybook_check',
              description: 'Check if Storybook config and stories exist. Returns missing items.',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'storybook_get_state',
              description: 'Get cached Storybook state from audit-state.json.',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'storybook_start_dev',
              description: 'Start Storybook dev server. Returns the URL when ready.',
              inputSchema: {
                type: 'object',
                properties: {
                  port: { type: 'number', description: 'Port for dev server (default: 6006)' },
                },
              },
            },
          ],
        },
        id,
      };

    case 'tools/call': {
      const { name, arguments: args = {} } = params;
      switch (name) {
        case 'storybook_list_components':
          return handleListComponents(args, id);
        case 'storybook_check':
          return handleCheck(id);
        case 'storybook_get_state':
          return handleGetState(id);
        case 'storybook_start_dev':
          return handleStartDev(args, id);
        default:
          return { jsonrpc: '2.0', error: { code: -32601, message: `Unknown tool: ${name}` }, id };
      }
    }

    default:
      return { jsonrpc: '2.0', error: { code: -32601, message: `Unknown method: ${method}` }, id };
  }
}

function findStories() {
  const stories = [];
  // Read from .storybook/main.ts to get stories path
  const mainPath = join(process.cwd(), '.storybook', 'main.ts');
  let pattern = 'src/**/*.stories.tsx';

  if (existsSync(mainPath)) {
    const content = readFileSync(mainPath, 'utf-8');
    const match = content.match(/stories:\s*\[["'](.+?)["']\]/);
    if (match) pattern = match[1];
  }

  // Simple glob finder (no external deps)
  function walkDir(dir, result) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath, result);
      } else if (entry.isFile() && entry.name.endsWith('.stories.tsx')) {
        result.push(fullPath);
      }
    }
  }

  const srcDir = join(process.cwd(), 'src');
  walkDir(srcDir, stories);
  return stories;
}

function parseStoryFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const stories = [];

  // Extract title
  const titleMatch = content.match(/title:\s*["'](.+?)["']/);
  const title = titleMatch ? titleMatch[1] : filePath;

  // Extract export const X: Story / StoryObj = { ... }
  const exportRegex = /export\s+const\s+(\w+)\s*:\s*(?:Story(?:Obj)?)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    if (match[1] !== 'meta' && match[1] !== 'default') {
      stories.push({ name: match[1], title, file: filePath });
    }
  }

  return { filePath, title, stories };
}

function handleListComponents(args, id) {
  const { filter } = args;
  const storyFiles = findStories();
  const components = [];

  for (const file of storyFiles) {
    const parsed = parseStoryFile(file);
    if (!filter || parsed.title.includes(filter)) {
      components.push({
        title: parsed.title,
        file: join('.', file),
        stories: parsed.stories.map((s) => s.name),
      });
    }
  }

  return {
    jsonrpc: '2.0',
    result: {
      content: [{ type: 'text', text: JSON.stringify({ total: components.length, components }, null, 2) }],
    },
    id,
  };
}

function handleCheck(id) {
  const issues = [];
  const ok = [];

  // Check .storybook directory
  const storybookDir = join(process.cwd(), '.storybook');
  if (existsSync(storybookDir)) {
    ok.push('.storybook/ directory exists');

    // Check main.ts
    if (existsSync(join(storybookDir, 'main.ts'))) {
      ok.push('.storybook/main.ts exists');
    } else {
      issues.push('Missing .storybook/main.ts');
    }

    // Check preview.ts
    if (existsSync(join(storybookDir, 'preview.ts'))) {
      ok.push('.storybook/preview.ts exists');
    } else {
      issues.push('Missing .storybook/preview.ts');
    }
  } else {
    issues.push('Missing .storybook/ directory');
  }

  // Check stories
  const stories = findStories();
  if (stories.length > 0) {
    ok.push(`${stories.length} story files found`);
    for (const s of stories) {
      ok.push(`  - ${join('.', s)}`);
    }
  } else {
    issues.push('No *.stories.tsx files found');
  }

  // Check storybook package
  const sbBin = join(process.cwd(), 'node_modules', '.bin', 'storybook');
  if (existsSync(sbBin) || existsSync(sbBin + '.cmd')) {
    ok.push('Storybook binary found');
  } else {
    issues.push('Storybook package not installed');
  }

  // Update state
  updateMCPState('storybook', {
    checkedAt: new Date().toISOString(),
    issues,
    ok,
    componentCount: stories.length,
  });

  return {
    jsonrpc: '2.0',
    result: {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: issues.length === 0 ? 'healthy' : 'needs_attention',
          issues,
          ok,
        }, null, 2),
      }],
    },
    id,
  };
}

function handleGetState(id) {
  const state = existsSync(AUDIT_STATE_PATH)
    ? JSON.parse(readFileSync(AUDIT_STATE_PATH, 'utf-8'))
    : {};

  return {
    jsonrpc: '2.0',
    result: {
      content: [{
        type: 'text',
        text: JSON.stringify(state.mcpStates?.storybook || {}, null, 2),
      }],
    },
    id,
  };
}

function handleStartDev(args, id) {
  const port = args.port || 6006;
  serverPort = port;

  const url = `http://localhost:${port}`;

  // Start Storybook dev server as child process
  const sbBin = join(process.cwd(), 'node_modules', '.bin', 'storybook.cmd');
  const bin = existsSync(sbBin) ? sbBin : 'storybook';

  storybookProcess = spawn(bin, ['dev', '-p', String(port), '--no-open'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  let output = '';
  storybookProcess.stdout.on('data', (data) => { output += data.toString(); });
  storybookProcess.stderr.on('data', (data) => { output += data.toString(); });

  return {
    jsonrpc: '2.0',
    result: {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: `Storybook dev server starting on ${url}`,
          url,
          port,
          pid: storybookProcess.pid,
        }, null, 2),
      }],
    },
    id,
  };
}

function updateMCPState(mcpName, data) {
  try {
    const state = existsSync(AUDIT_STATE_PATH)
      ? JSON.parse(readFileSync(AUDIT_STATE_PATH, 'utf-8'))
      : {};

    state.mcpStates = state.mcpStates || {};
    state.mcpStates[mcpName] = { ...state.mcpStates[mcpName], ...data };
    state.updated = new Date().toISOString();

    writeFileSync(AUDIT_STATE_PATH, JSON.stringify(state, null, 2));
  } catch {
    // fail silently
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  if (storybookProcess) {
    storybookProcess.kill();
  }
  process.exit(0);
});

process.stderr.write('[storybook-mcp] Server ready (stdio mode)\n');
