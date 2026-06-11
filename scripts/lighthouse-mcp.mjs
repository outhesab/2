#!/usr/bin/env node
/**
 * Lighthouse MCP Server for PARSPEL Audit
 *
 * Provides MCP-compatible interface for running Lighthouse audits.
 * Called by parspel-audit skill.
 *
 * Protocol: stdio (JSON-RPC 2.0 over stdin/stdout)
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const AUDIT_STATE_PATH = join(process.cwd(), '.opencode', 'memory', 'audit-state.json');

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
          serverInfo: { name: 'lighthouse-mcp', version: '1.0.0' },
        },
        id,
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        result: {
          tools: [
            {
              name: 'lighthouse_audit',
              description: 'Run Lighthouse audit on a URL and return scores for performance, accessibility, best-practices, SEO.',
              inputSchema: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'URL to audit (e.g. http://localhost:3000)' },
                  categories: {
                    type: 'array',
                    items: { type: 'string', enum: ['performance', 'accessibility', 'best-practices', 'seo'] },
                    description: 'Categories to audit',
                  },
                },
                required: ['url'],
              },
            },
            {
              name: 'lighthouse_get_state',
              description: 'Get cached Lighthouse scores from audit-state.json.',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
          ],
        },
        id,
      };

    case 'tools/call':
      if (params.name === 'lighthouse_audit') {
        return handleAudit(params.arguments, id);
      }
      if (params.name === 'lighthouse_get_state') {
        return handleGetState(id);
      }
      return { jsonrpc: '2.0', error: { code: -32601, message: `Unknown tool: ${params.name}` }, id };

    default:
      return { jsonrpc: '2.0', error: { code: -32601, message: `Unknown method: ${method}` }, id };
  }
}

function handleAudit(args, id) {
  const { url } = args;
  console.error(`[lighthouse-mcp] Auditing: ${url}`);

  try {
    // Run Lighthouse CLI (assumes lighthouse is installed globally or via npx)
    const result = execSync(
      `npx lighthouse "${url}" --output=json --output-path=stdout --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo`,
      { timeout: 120000, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    const report = JSON.parse(result);
    const scores = {};
    for (const cat of Object.values(report.categories || {})) {
      scores[cat.id] = Math.round(cat.score * 100);
    }

    // Update audit state
    updateAuditState(url, scores);

    return {
      jsonrpc: '2.0',
      result: {
        content: [{ type: 'text', text: JSON.stringify({ url, scores }, null, 2) }],
      },
      id,
    };
  } catch (err) {
    return {
      jsonrpc: '2.0',
      result: {
        content: [{ type: 'text', text: JSON.stringify({ url, error: err.message }) }],
        isError: true,
      },
      id,
    };
  }
}

function handleGetState(id) {
  const state = existsSync(AUDIT_STATE_PATH)
    ? JSON.parse(readFileSync(AUDIT_STATE_PATH, 'utf-8'))
    : { lastLighthouse: {} };

  return {
    jsonrpc: '2.0',
    result: {
      content: [{ type: 'text', text: JSON.stringify(state.lastLighthouse || {}, null, 2) }],
    },
    id,
  };
}

function updateAuditState(url, scores) {
  try {
    const state = existsSync(AUDIT_STATE_PATH)
      ? JSON.parse(readFileSync(AUDIT_STATE_PATH, 'utf-8'))
      : {};

    state.lastLighthouse = state.lastLighthouse || {};
    state.lastLighthouse[url] = {
      scores,
      timestamp: new Date().toISOString(),
    };

    // Update MCP state
    state.mcpStates = state.mcpStates || {};
    state.mcpStates.lighthouse = state.mcpStates.lighthouse || {};
    state.mcpStates.lighthouse.pageScores = state.mcpStates.lighthouse.pageScores || {};
    state.mcpStates.lighthouse.pageScores[url] = scores;
    state.mcpStates.lighthouse.lastAuditTimestamp = new Date().toISOString();
    if (!state.mcpStates.lighthouse.auditedPages.includes(url)) {
      state.mcpStates.lighthouse.auditedPages.push(url);
    }

    state.updated = new Date().toISOString();
    writeFileSync(AUDIT_STATE_PATH, JSON.stringify(state, null, 2));
    console.error(`[lighthouse-mcp] State updated for ${url}`);
  } catch (err) {
    console.error(`[lighthouse-mcp] Failed to update state: ${err.message}`);
  }
}

// Ready signal
process.stderr.write('[lighthouse-mcp] Server ready (stdio mode)\n');
