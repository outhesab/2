import * as XLSX from 'xlsx';

const DEFAULT_ALLOWED_EXTENSIONS = ['.xlsx', '.xlsm', '.csv'] as const;
const DANGEROUS_HEADER_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export const SAFE_XLSX_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxSheets: 8,
  maxRows: 5000,
  maxCols: 120,
};

export interface SafeWorkbookData {
  sheetNames: string[];
  getSheetRows: (sheetName: string, options?: { defval?: unknown; blankrows?: boolean }) => unknown[][];
}

function fileExt(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

function fail(message: string): never {
  throw new Error(message);
}

export function assertSafeSpreadsheetFile(file: File, allowedExtensions: readonly string[] = DEFAULT_ALLOWED_EXTENSIONS): void {
  const ext = fileExt(file.name);
  if (!allowedExtensions.includes(ext)) {
    fail(`Desteklenmeyen dosya tipi: ${ext || 'bilinmiyor'}`);
  }
  if (file.size > SAFE_XLSX_LIMITS.maxBytes) {
    fail(`Dosya cok buyuk. En fazla ${Math.round(SAFE_XLSX_LIMITS.maxBytes / (1024 * 1024))} MB desteklenir.`);
  }
}

function validateSheetRange(ws: XLSX.WorkSheet, sheetName: string, sourceName?: string): void {
  const ref = ws['!ref'];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  const rowCount = range.e.r + 1;
  const colCount = range.e.c + 1;
  if (rowCount > SAFE_XLSX_LIMITS.maxRows) {
    fail(`${sourceName || 'Dosya'} icindeki ${sheetName} sayfasi cok buyuk. En fazla ${SAFE_XLSX_LIMITS.maxRows} satir desteklenir.`);
  }
  if (colCount > SAFE_XLSX_LIMITS.maxCols) {
    fail(`${sourceName || 'Dosya'} icindeki ${sheetName} sayfasi cok genis. En fazla ${SAFE_XLSX_LIMITS.maxCols} sutun desteklenir.`);
  }
}

export async function readSafeWorkbook(input: ArrayBuffer, options: { sourceName?: string }): Promise<SafeWorkbookData> {
  const workbook = XLSX.read(input, { type: 'array' });

  if (workbook.SheetNames.length === 0) {
    fail('Dosyada okunabilir sayfa bulunamadi.');
  }
  if (workbook.SheetNames.length > SAFE_XLSX_LIMITS.maxSheets) {
    fail(`Cok fazla sayfa var. En fazla ${SAFE_XLSX_LIMITS.maxSheets} sayfa desteklenir.`);
  }

  workbook.SheetNames.forEach(name => validateSheetRange(workbook.Sheets[name], name, options.sourceName));

  return {
    sheetNames: workbook.SheetNames,
    getSheetRows: (sheetName, rowOptions = {}) => {
      const ws = workbook.Sheets[sheetName];
      if (!ws) return [];

      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
        header: 1,
        defval: rowOptions.defval != null ? String(rowOptions.defval) : '',
        blankrows: rowOptions.blankrows ?? false,
      }) as unknown[][];

      if (rows.length > SAFE_XLSX_LIMITS.maxRows) {
        fail(`Sayfa veri limiti asildi. En fazla ${SAFE_XLSX_LIMITS.maxRows} satir desteklenir.`);
      }

      if (!rowOptions.blankrows) {
        return rows.filter(row => row.some(cell => cell != null && String(cell).trim() !== ''));
      }

      return rows;
    },
  };
}

export function makeSafeHeaders(headerRow: Array<string | number | boolean | null | undefined>): string[] {
  const seen = new Map<string, number>();

  return headerRow.map((header, index) => {
    const raw = header != null ? String(header).trim() : `Sutun ${index + 1}`;
    const normalized = raw || `Sutun ${index + 1}`;
    const safeBase = DANGEROUS_HEADER_KEYS.has(normalized) ? `Alan ${index + 1}` : normalized;
    const dupCount = seen.get(safeBase) ?? 0;
    seen.set(safeBase, dupCount + 1);
    return dupCount === 0 ? safeBase : `${safeBase}_${dupCount + 1}`;
  });
}

function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).find(line => line.trim().length > 0) || '';
  const candidates = [',', ';', '\t'];
  return candidates.sort((left, right) => sample.split(right).length - sample.split(left).length)[0] || ',';
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

export function parseCsvText(text: string): unknown[][] {
  const delimiter = detectDelimiter(text);
  const rows = text
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .map(line => parseDelimitedLine(line, delimiter));

  if (rows.length > SAFE_XLSX_LIMITS.maxRows) {
    fail(`CSV veri limiti asildi. En fazla ${SAFE_XLSX_LIMITS.maxRows} satir desteklenir.`);
  }

  rows.forEach((row) => {
    if (row.length > SAFE_XLSX_LIMITS.maxCols) {
      fail(`CSV sutun limiti asildi. En fazla ${SAFE_XLSX_LIMITS.maxCols} sutun desteklenir.`);
    }
  });

  return rows;
}

function applyColumnWidths(worksheet: XLSX.WorkSheet, widths?: number[]) {
  if (widths && widths.length > 0) {
    worksheet['!cols'] = widths.map(w => ({ wch: Math.max(w, 0) }));
  }
}

function triggerDownload(buffer: BlobPart, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadObjectSheetsAsXlsx(
  sheets: Array<{ name: string; rows: Record<string, unknown>[]; widths?: number[] }>,
  fileName: string,
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    applyColumnWidths(ws, sheet.widths);
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  });

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  triggerDownload(buffer, fileName);
}

export async function downloadAoASheetsAsXlsx(
  sheets: Array<{ name: string; rows: unknown[][]; widths?: number[] }>,
  fileName: string,
): Promise<void> {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    applyColumnWidths(ws, sheet.widths);
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  });

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  triggerDownload(buffer, fileName);
}
