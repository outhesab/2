export interface SheetData {
  name: string;
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
  rawRows: (string | number | boolean | null)[][];
}

export interface ExcelFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  sheets: SheetData[];
  isRecovery: boolean;
  fileType: 'excel' | 'csv' | 'json' | 'xml';
}

export interface DiffRow {
  rowIndex: number;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValues?: Record<string, string | number | boolean | null>;
  newValues?: Record<string, string | number | boolean | null>;
  changedCells?: string[];
}

export interface SheetDiff {
  sheetName: string;
  rows: DiffRow[];
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount: number;
}

export interface FileDiff {
  fileA: ExcelFile;
  fileB: ExcelFile;
  sheets: SheetDiff[];
}

export interface SearchResult {
  fileId: string;
  fileName: string;
  sheetName: string;
  rowIndex: number;
  colName: string;
  value: string | number | boolean | null;
  matchType: 'exact' | 'contains' | 'regex' | 'wildcard';
}

export type JoinType = 'inner' | 'left' | 'right' | 'fullOuter' | 'verticalUnion';

export interface CleanOptions {
  trimWhitespace: boolean;
  deduplicateRows: boolean;
  fillNullsWithEmpty: boolean;
  standardizeCase: 'none' | 'upper' | 'lower' | 'title';
  standardizeDates: boolean;
}

export interface MergeOptions {
  keyColumn: string;
  strategy: 'latest' | 'first' | 'union' | 'intersection';
  joinType: JoinType;
  sheets: string[];
  fuzzyMatch: boolean;
  fuzzyThreshold: number;
  cleanOptions: CleanOptions;
}

export interface MergeReport {
  totalInputRows: number;
  matchedRows: number;
  unmatchedFromA: number;
  unmatchedFromB: number;
  totalOutputRows: number;
  duplicatesRemoved: number;
  nullsFilled: number;
  fuzzyMatchCount: number;
  columnConflicts: Array<{ column: string; conflictCount: number }>;
  skippedRows: number;
}

export interface MergeResult {
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
  sourceInfo: Record<number, { fileId: string; fileName: string; sheetName: string }>;
  report: MergeReport;
}

export interface CleanResult {
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
  originalCount: number;
  cleanedCount: number;
  duplicatesRemoved: number;
  nullsFilled: number;
  trimmedCells: number;
}
