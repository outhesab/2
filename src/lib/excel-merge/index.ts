/**
 * excel-merge/index.ts — Ana giriş noktası
 *
 * Tüm fonksiyon ve tipleri alt modüllerden re-export eder.
 * Kullanım: import { mergeFiles, parseExcelFile } from '@/lib/excel-merge'
 */
export type {
  SheetData,
  ExcelFile,
  DiffRow,
  SheetDiff,
  FileDiff,
  SearchResult,
  MergeOptions,
  MergeReport,
  MergeResult,
  CleanOptions,
  CleanResult,
  JoinType,
} from '@/lib/excel-merge-types';

// Parsers
export { parseExcelFile, parseCsvFile, parseJsonFile, parseXmlFile } from './parser';

// Merge Engine
export {
  buildRowsAndSource,
  diffSheets,
  searchAcrossFiles,
  mergeFiles,
  exportToExcel,
  exportReportToExcel,
} from './mergeEngine';

// Utils (re-export from existing file)
export { formatFileSize, cleanSheetData } from '@/lib/excel-merge-utils';
