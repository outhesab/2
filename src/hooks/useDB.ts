// useDB.ts — re-exports from modularized db/ structure (direct imports, no barrel)
// See src/hooks/db/ for the actual implementation

export { useDB } from "./db/core";
export type { SyncStatus, RestoreReport } from "./db/core";
export { onSyncStatus, getSyncStatus } from "./db/sync";
export {
  saveBackupToFirebase,
  listBackupsFromFirebase,
  restoreBackupFromFirebase,
  mergeRestoreDB,
  fullRestoreDB,
} from "./db/backup";
export type { RestoreReport as BackupRestoreReport } from "./db/backup";
export type { RestoreReport as RestoreReportAlias } from "./db/backup";
