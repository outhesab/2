/**
 * excel-merge/mergeEngine.ts — Birleştirme, fark ve arama motoru
 */
import type {
  SheetData,
  ExcelFile,
  DiffRow,
  SheetDiff,
  SearchResult,
  MergeOptions,
  MergeReport,
  MergeResult,
  CleanOptions,
} from '@/lib/excel-merge-types';
import { cellToString, applyCleanOptions, fuzzyMatch } from '@/lib/excel-merge-utils';
import { downloadAoASheetsAsXlsx } from '@/lib/safeXlsx';
import { logger } from '@/lib/logger';

// ── Birleştirme Stratejileri ─────────────────────────────────────────────────

function mergeRowsByStrategy(
  rowA: Record<string, string | number | boolean | null>,
  rowB: Record<string, string | number | boolean | null>,
  strategy: MergeOptions['strategy'],
): Record<string, string | number | boolean | null> {
  if (strategy === 'latest') return { ...rowA, ...rowB };
  if (strategy === 'first') return { ...rowB, ...rowA };
  if (strategy === 'union') {
    const merged = { ...rowA };
    Object.entries(rowB).forEach(([k, v]) => {
      if (merged[k] == null || merged[k] === '') merged[k] = v;
    });
    return merged;
  }
  return { ...rowA };
}

// ── Row/Source Builder ───────────────────────────────────────────────────────

export function buildRowsAndSource(allSheets: { sheet: SheetData; file: ExcelFile }[]): {
  rows: Record<string, string | number | boolean | null>[];
  sourceInfo: Record<number, { fileId: string; fileName: string; sheetName: string }>;
} {
  const rows: Record<string, string | number | boolean | null>[] = [];
  const sourceInfo: Record<number, { fileId: string; fileName: string; sheetName: string }> = {};
  allSheets.forEach(({ sheet, file }) => {
    sheet.rows.forEach((row) => {
      const idx = rows.length;
      rows.push(row);
      sourceInfo[idx] = { fileId: file.id, fileName: file.name, sheetName: sheet.name };
    });
  });
  return { rows, sourceInfo };
}

// ── Temizlik ──────────────────────────────────────────────────────────────────

function applyCleanAndReport(
  rows: Record<string, string | number | boolean | null>[],
  headers: string[],
  cleanOptions: CleanOptions,
  report: MergeReport,
): { rows: Record<string, string | number | boolean | null>[] } {
  const cleanResult = applyCleanOptions(rows, headers, cleanOptions);
  report.duplicatesRemoved = cleanResult.duplicatesRemoved;
  report.nullsFilled = cleanResult.nullsFilled;
  report.totalOutputRows = cleanResult.rows.length;
  return { rows: cleanResult.rows };
}

// ── Fark Bulma ───────────────────────────────────────────────────────────────

export function diffSheets(sheetA: SheetData, sheetB: SheetData, keyColumn?: string): SheetDiff {
  const headers = Array.from(new Set([...sheetA.headers, ...sheetB.headers]));
  const result: DiffRow[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let unchangedCount = 0;

  if (keyColumn && sheetA.headers.includes(keyColumn) && sheetB.headers.includes(keyColumn)) {
    const mapA = new Map<string, Record<string, string | number | boolean | null>>();
    const mapB = new Map<string, Record<string, string | number | boolean | null>>();

    sheetA.rows.forEach((row, i) => {
      const key = cellToString(row[keyColumn]) || `__row_${i}`;
      mapA.set(key, row);
    });
    sheetB.rows.forEach((row, i) => {
      const key = cellToString(row[keyColumn]) || `__row_${i}`;
      mapB.set(key, row);
    });

    let rowIndex = 0;
    const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);
    allKeys.forEach((key) => {
      const rowA = mapA.get(key);
      const rowB = mapB.get(key);

      if (rowA && !rowB) {
        result.push({ rowIndex: rowIndex++, status: 'removed', oldValues: rowA });
        removedCount++;
      } else if (!rowA && rowB) {
        result.push({ rowIndex: rowIndex++, status: 'added', newValues: rowB });
        addedCount++;
      } else if (rowA && rowB) {
        const changedCells: string[] = [];
        headers.forEach((h) => {
          if (cellToString(rowA[h]) !== cellToString(rowB[h])) changedCells.push(h);
        });
        if (changedCells.length > 0) {
          result.push({ rowIndex: rowIndex++, status: 'modified', oldValues: rowA, newValues: rowB, changedCells });
          modifiedCount++;
        } else {
          result.push({ rowIndex: rowIndex++, status: 'unchanged', oldValues: rowA, newValues: rowB });
          unchangedCount++;
        }
      }
    });
  } else {
    const maxLen = Math.max(sheetA.rows.length, sheetB.rows.length);
    for (let i = 0; i < maxLen; i++) {
      const rowA = sheetA.rows[i];
      const rowB = sheetB.rows[i];
      if (rowA && !rowB) {
        result.push({ rowIndex: i, status: 'removed', oldValues: rowA });
        removedCount++;
      } else if (!rowA && rowB) {
        result.push({ rowIndex: i, status: 'added', newValues: rowB });
        addedCount++;
      } else if (rowA && rowB) {
        const changedCells: string[] = [];
        headers.forEach((h) => {
          if (cellToString(rowA[h]) !== cellToString(rowB[h])) changedCells.push(h);
        });
        if (changedCells.length > 0) {
          result.push({ rowIndex: i, status: 'modified', oldValues: rowA, newValues: rowB, changedCells });
          modifiedCount++;
        } else {
          result.push({ rowIndex: i, status: 'unchanged', oldValues: rowA, newValues: rowB });
          unchangedCount++;
        }
      }
    }
  }

  return { sheetName: sheetB.name, rows: result, addedCount, removedCount, modifiedCount, unchangedCount };
}

// ── Arama ────────────────────────────────────────────────────────────────────

export function searchAcrossFiles(
  files: ExcelFile[],
  query: string,
  matchType: 'exact' | 'contains' | 'regex' | 'wildcard',
  sheetsFilter?: string[],
): SearchResult[] {
  const results: SearchResult[] = [];
  if (!query.trim()) return results;

  let regex: RegExp | null = null;
  if (matchType === 'regex') {
    try {
      regex = new RegExp(query, 'i');
    } catch {
      logger.warn('excelMerge', 'Geçersiz regex deseni');
      return results;
    }
  } else if (matchType === 'wildcard') {
    const escaped = query
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    regex = new RegExp(`^${escaped}$`, 'i');
  }

  const matchValue = (val: string | number | boolean | null): boolean => {
    const str = cellToString(val);
    if (!str) return false;
    switch (matchType) {
      case 'exact':
        return str.toLowerCase() === query.toLowerCase();
      case 'contains':
        return str.toLowerCase().includes(query.toLowerCase());
      case 'regex':
      case 'wildcard':
        return regex?.test(str) ?? false;
    }
  };

  files.forEach((file) => {
    file.sheets.forEach((sheet) => {
      if (sheetsFilter && sheetsFilter.length > 0 && !sheetsFilter.includes(sheet.name)) return;
      sheet.rows.forEach((row, rowIndex) => {
        sheet.headers.forEach((col) => {
          if (matchValue(row[col])) {
            results.push({
              fileId: file.id,
              fileName: file.name,
              sheetName: sheet.name,
              rowIndex,
              colName: col,
              value: row[col],
              matchType,
            });
          }
        });
      });
    });
  });

  return results;
}

// ── Birleştirme ──────────────────────────────────────────────────────────────

export function mergeFiles(files: ExcelFile[], options: MergeOptions): MergeResult {
  const { keyColumn, strategy, joinType, sheets, fuzzyMatch: useFuzzy, fuzzyThreshold, cleanOptions } = options;

  const report: MergeReport = {
    totalInputRows: 0,
    matchedRows: 0,
    unmatchedFromA: 0,
    unmatchedFromB: 0,
    totalOutputRows: 0,
    duplicatesRemoved: 0,
    nullsFilled: 0,
    fuzzyMatchCount: 0,
    columnConflicts: [],
    skippedRows: 0,
  };

  const allSheets: { sheet: SheetData; file: ExcelFile }[] = [];

  files.forEach((file) => {
    file.sheets.forEach((sheet) => {
      if (sheets.length === 0 || sheets.includes(sheet.name)) {
        allSheets.push({ sheet, file });
        report.totalInputRows += sheet.rows.length;
      }
    });
  });

  if (allSheets.length === 0) {
    return { headers: [], rows: [], sourceInfo: {}, report };
  }

  const allHeaders = Array.from(new Set(allSheets.flatMap(({ sheet }) => sheet.headers)));

  if (joinType === 'verticalUnion') {
    const { rows, sourceInfo } = buildRowsAndSource(allSheets);
    const { rows: cleaned } = applyCleanAndReport(rows, allHeaders, cleanOptions, report);
    return { headers: allHeaders, rows: cleaned, sourceInfo, report };
  }

  if (!keyColumn || !allSheets[0].sheet.headers.includes(keyColumn)) {
    const { rows, sourceInfo } = buildRowsAndSource(allSheets);
    report.totalOutputRows = rows.length;
    return { headers: allHeaders, rows, sourceInfo, report };
  }

  type MapEntry = {
    row: Record<string, string | number | boolean | null>;
    source: { fileId: string; fileName: string; sheetName: string };
    fileIndex: number;
    originalKey: string;
  };

  const keyMapA = new Map<string, MapEntry>();
  const keyMapB = new Map<string, MapEntry>();

  const fileA = allSheets[0];
  const filesB = allSheets.slice(1);

  fileA.sheet.rows.forEach((row) => {
    const key = cellToString(row[keyColumn]);
    if (!key) return;
    keyMapA.set(key, {
      row: { ...row },
      source: { fileId: fileA.file.id, fileName: fileA.file.name, sheetName: fileA.sheet.name },
      fileIndex: 0,
      originalKey: key,
    });
  });

  filesB.forEach(({ sheet, file }, bIdx) => {
    sheet.rows.forEach((row) => {
      const key = cellToString(row[keyColumn]);
      if (!key) return;
      keyMapB.set(key, {
        row: { ...row },
        source: { fileId: file.id, fileName: file.name, sheetName: sheet.name },
        fileIndex: bIdx + 1,
        originalKey: key,
      });
    });
  });

  const lookupB = (keyA: string): MapEntry | undefined => {
    if (keyMapB.has(keyA)) return keyMapB.get(keyA);
    if (useFuzzy) {
      for (const [keyB, entry] of keyMapB) {
        if (fuzzyMatch(keyA, keyB, fuzzyThreshold)) {
          report.fuzzyMatchCount++;
          return entry;
        }
      }
    }
    return undefined;
  };

  const rows: Record<string, string | number | boolean | null>[] = [];
  const sourceInfo: Record<number, { fileId: string; fileName: string; sheetName: string }> = {};
  const matchedBKeys = new Set<string>();

  keyMapA.forEach((entryA, keyA) => {
    const entryB = lookupB(keyA);

    if (entryB) {
      matchedBKeys.add(entryB.originalKey);
      report.matchedRows++;

      const merged = mergeRowsByStrategy(entryA.row, entryB.row, strategy);

      const idx = rows.length;
      rows.push(merged);
      sourceInfo[idx] = entryA.source;
    } else {
      if (joinType === 'left' || joinType === 'fullOuter') {
        report.unmatchedFromA++;
        const idx = rows.length;
        rows.push({ ...entryA.row });
        sourceInfo[idx] = entryA.source;
      } else {
        report.skippedRows++;
      }
    }
  });

  if (joinType === 'right' || joinType === 'fullOuter') {
    keyMapB.forEach((entryB, bKey) => {
      if (!matchedBKeys.has(bKey)) {
        report.unmatchedFromB++;

        const idx = rows.length;
        rows.push({ ...entryB.row });
        sourceInfo[idx] = entryB.source;
      }
    });
  }

  const { rows: cleaned } = applyCleanAndReport(rows, allHeaders, cleanOptions, report);
  return { headers: allHeaders, rows: cleaned, sourceInfo, report };
}

// ── Dışa Aktarma ─────────────────────────────────────────────────────────────

export function exportToExcel(
  headers: string[],
  rows: Record<string, string | number | boolean | null>[],
  fileName: string,
  sheetName = 'Birleştirilmiş Veri',
): void {
  const data = [headers, ...rows.map((row) => headers.map((h) => row[h] ?? ''))];
  void downloadAoASheetsAsXlsx([{ name: sheetName, rows: data }], fileName);
}

export function exportReportToExcel(report: MergeReport, fileName: string): void {
  const rows = [
    ['Metrik', 'Deger'],
    ['Toplam Girdi Satir', report.totalInputRows],
    ['Eslesen Satir', report.matchedRows],
    ['A Dosyasinda Eslesmeyen', report.unmatchedFromA],
    ['B Dosyasinda Eslesmeyen', report.unmatchedFromB],
    ['Toplam Cikti Satir', report.totalOutputRows],
    ['Kaldirilan Tekrar', report.duplicatesRemoved],
    ['Doldurulan Bos Hucre', report.nullsFilled],
    ['Bulank Eslestirme Sayisi', report.fuzzyMatchCount],
    ['Atlanan Satir', report.skippedRows],
  ];
  void downloadAoASheetsAsXlsx([{ name: 'Birlestirme Raporu', rows }], fileName);
}
