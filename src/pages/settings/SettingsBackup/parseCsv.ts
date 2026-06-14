import { CSV_COLUMN_MAP } from './types';
import type { CsvColumnMapping } from './types';

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(/[,;\t]/).map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v !== ''));
}

export function detectCsvColumns(headers: string[]): CsvColumnMapping[] {
  return headers.map((h) => {
    const lower = h.toLowerCase().trim();
    const match = CSV_COLUMN_MAP[lower];
    if (match) {
      return {
        csvColumn: h,
        targetEntity: match.target,
        targetField: match.field,
        autoDetected: true,
      };
    }
    for (const [key, val] of Object.entries(CSV_COLUMN_MAP)) {
      if (lower.includes(key)) {
        return {
          csvColumn: h,
          targetEntity: val.target,
          targetField: val.field,
          autoDetected: true,
        };
      }
    }
    return {
      csvColumn: h,
      targetEntity: '',
      targetField: '',
      autoDetected: false,
    };
  });
}

export type { CsvColumnMapping };
