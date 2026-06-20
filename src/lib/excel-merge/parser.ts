/**
 * excel-merge/parser.ts — Dosya ayrıştırma fonksiyonları
 */
import { logger } from "@/lib/logger";
import { assertSafeSpreadsheetFile, makeSafeHeaders, parseCsvText, readSafeWorkbook } from "@/lib/safeXlsx";
import type { ExcelFile, SheetData } from "@/lib/excel-merge-types";

// ── Yardımcılar ──────────────────────────────────────────────────────────────

function detectRecoveryFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.includes("kurtarma") ||
    lower.includes("recovery") ||
    lower.includes("autosave") ||
    lower.includes("~$") ||
    lower.startsWith("~") ||
    /\(\d+\)\.(xlsx|xlsm|csv|json|xml)$/.test(lower) ||
    lower.includes("_backup") ||
    lower.includes("_bak") ||
    lower.includes("kopya") ||
    lower.includes("copy")
  );
}

function buildExcelResult(file: File, sheets: SheetData[], fileType: ExcelFile['fileType']): ExcelFile {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    uploadedAt: new Date(),
    sheets,
    isRecovery: detectRecoveryFile(file.name),
    fileType,
  };
}

function headersToRow(
  headers: string[],
  arr: (string | number | boolean | null)[],
  transform?: (val: string | number | boolean | null | Date, i: number) => string | number | boolean | null,
): Record<string, string | number | boolean | null> {
  const obj: Record<string, string | number | boolean | null> = {};
  headers.forEach((header, i) => {
    const val = arr[i] ?? null;
    obj[header] = transform ? transform(val, i) : (val as string | number | boolean | null);
  });
  return obj;
}

// ── Ayrıştırma Fonksiyonları ─────────────────────────────────────────────────

export async function parseExcelFile(file: File): Promise<ExcelFile> {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

  if (ext === ".csv") return parseCsvFile(file);
  if (ext === ".json") return parseJsonFile(file);
  if (ext === ".xml") return parseXmlFile(file);

  assertSafeSpreadsheetFile(file, ['.xlsx', '.xlsm']);
  const buffer = await file.arrayBuffer();
  const workbook = await readSafeWorkbook(buffer, { sourceName: file.name });

  const sheets: SheetData[] = workbook.sheetNames.map((sheetName) => {
    const rawData = workbook.getSheetRows(sheetName, { defval: null, blankrows: true }) as (string | number | boolean | null)[][];

    if (rawData.length === 0) {
      return { name: sheetName, headers: [], rows: [], rawRows: [] };
    }

    const headerRow = rawData[0] as (string | number | boolean | null)[];
    const headers = makeSafeHeaders(headerRow);

    const rows = rawData.slice(1).map((rawRow) => {
      return headersToRow(headers, rawRow, (val) => val instanceof Date ? val.toLocaleDateString("tr-TR") : val);
    });

    const rawRows = rawData.slice(1) as (string | number | boolean | null)[][];
    return { name: sheetName, headers, rows, rawRows };
  });

  return buildExcelResult(file, sheets, "excel");
}

export async function parseCsvFile(file: File): Promise<ExcelFile> {
  assertSafeSpreadsheetFile(file, ['.csv']);
  const text = await file.text();
  const rawData = parseCsvText(text) as (string | number | boolean | null)[][];

  const headers =
    rawData.length > 0
      ? makeSafeHeaders(rawData[0] as (string | number | boolean | null)[])
      : [];

  const rows = rawData.slice(1).map((rawRow) => headersToRow(headers, rawRow));

  return buildExcelResult(file, [{ name: "Sayfa1", headers, rows, rawRows: rawData.slice(1) as (string | number | boolean | null)[][] }], "csv");
}

export async function parseJsonFile(file: File): Promise<ExcelFile> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    logger.warn("excelMerge", "JSON ayrıştırma hatası");
    throw new Error("Geçersiz JSON dosyası");
  }

  const arr: Record<string, unknown>[] = Array.isArray(data) ? data as Record<string, unknown>[] : [data as Record<string, unknown>];
  const headers = arr.length > 0 ? Object.keys(arr[0]) : [];
  const rows: Record<string, string | number | boolean | null>[] = arr.map((item) => {
    const row: Record<string, string | number | boolean | null> = {};
    headers.forEach((h) => {
      const v = item[h];
      if (v == null) row[h] = null;
      else if (typeof v === "object") row[h] = JSON.stringify(v);
      else row[h] = v as string | number | boolean;
    });
    return row;
  });

  return buildExcelResult(file, [{ name: "JSON Veri", headers, rows, rawRows: [] }], "json");
}

export async function parseXmlFile(file: File): Promise<ExcelFile> {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("Geçersiz XML dosyası");

  const root = doc.documentElement;
  const children = Array.from(root.children);

  if (children.length === 0) {
    return buildExcelResult(file, [{ name: "XML Veri", headers: [], rows: [], rawRows: [] }], "xml");
  }

  const headerSet = new Set<string>();
  children.forEach((child) => {
    Array.from(child.children).forEach((el) => headerSet.add(el.tagName));
    Array.from(child.attributes).forEach((attr) => headerSet.add(`@${attr.name}`));
  });
  const headers = Array.from(headerSet);

  const rows: Record<string, string | number | boolean | null>[] = children.map((child) => {
    const row: Record<string, string | number | boolean | null> = {};
    headers.forEach((h) => {
      if (h.startsWith("@")) {
        row[h] = child.getAttribute(h.slice(1)) ?? null;
      } else {
        const el = child.querySelector(h);
        row[h] = el ? el.textContent : null;
      }
    });
    return row;
  });

  return buildExcelResult(file, [{ name: "XML Veri", headers, rows, rawRows: [] }], "xml");
}
