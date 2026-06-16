import type { CleanOptions, CleanResult, SheetData } from "./excel-merge-types";

export function cellToString(val: string | number | boolean | null): string {
  if (val == null) return "";
  return String(val).trim();
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export function fuzzyMatch(a: string, b: string, threshold: number): boolean {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return true;
  const maxLen = Math.max(al.length, bl.length);
  if (maxLen === 0) return true;
  const dist = levenshtein(al, bl);
  const similarity = 1 - dist / maxLen;
  return similarity >= threshold;
}

export function applyCleanOptions(
  rows: Record<string, string | number | boolean | null>[],
  headers: string[],
  opts: CleanOptions
): { rows: Record<string, string | number | boolean | null>[]; nullsFilled: number; trimmedCells: number; duplicatesRemoved: number } {
  let nullsFilled = 0;
  let trimmedCells = 0;
  let duplicatesRemoved = 0;

  let result = rows.map((row) => {
    const newRow: Record<string, string | number | boolean | null> = {};
    for (const h of headers) {
      let val = row[h];

      if (opts.fillNullsWithEmpty && val == null) {
        val = "";
        nullsFilled++;
      }

      if (typeof val === "string") {
        if (opts.trimWhitespace) {
          const trimmed = val.trim();
          if (trimmed !== val) trimmedCells++;
          val = trimmed;
        }
        if (opts.standardizeCase !== "none") {
          if (opts.standardizeCase === "upper") val = val.toUpperCase();
          else if (opts.standardizeCase === "lower") val = val.toLowerCase();
          else if (opts.standardizeCase === "title") {
            val = val.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
          }
        }
      }

      newRow[h] = val;
    }
    return newRow;
  });

  if (opts.deduplicateRows) {
    const seen = new Set<string>();
    const deduped: typeof result = [];
    for (const row of result) {
      const key = JSON.stringify(headers.map((h) => row[h]));
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(row);
      } else {
        duplicatesRemoved++;
      }
    }
    result = deduped;
  }

  return { rows: result, nullsFilled, trimmedCells, duplicatesRemoved };
}

export function cleanSheetData(sheet: SheetData, opts: CleanOptions): CleanResult {
  const originalCount = sheet.rows.length;
  const { rows, nullsFilled, trimmedCells, duplicatesRemoved } = applyCleanOptions(
    sheet.rows,
    sheet.headers,
    opts
  );
  return {
    headers: sheet.headers,
    rows,
    originalCount,
    cleanedCount: rows.length,
    duplicatesRemoved,
    nullsFilled,
    trimmedCells,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
