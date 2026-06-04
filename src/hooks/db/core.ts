import { indexedDb } from "@/db/indexeddb";
import { createAuditEntry, trimAuditLog } from "@/lib/auditEngine";
import { logger } from "@/lib/logger";
import { validateTransaction } from "@/lib/ruleEngine";
import { genId } from "@/lib/utils-tr";
import { isGuestSession } from "@/lib/userManager";
import { safeClone } from "@/lib/safeClone";
import type { DB, Kasa, ProductCategory, RuleViolation } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveToFirebase, loadFromFirebase, emitSync, type SyncStatus } from "./sync";
import { saveBackupToFirebase, restoreBackupFromFirebase, listBackupsFromFirebase, fullRestoreDB, type RestoreReport } from "./backup";

export type { SyncStatus, RestoreReport };

const STORAGE_KEY = "sobaYonetim";
const INDEXED_SNAPSHOT_KEY = "primary";

async function saveToIndexedSnapshot(db: DB): Promise<void> {
  const t = logger.time("db", "IndexedSnapshot yaz");
  try {
    const data = JSON.stringify(db);
    await indexedDb.snapshots.put({
      id: INDEXED_SNAPSHOT_KEY,
      data,
      updatedAt: new Date().toISOString(),
    });
    t.end({ size: data.length });
  } catch (e) {
    t.end({ error: String(e) });
    logger.warn("db", "IndexedDB snapshot yazılamadı", { error: String(e) });
  }
}

async function loadFromIndexedSnapshot(): Promise<DB | null> {
  const t = logger.time("db", "IndexedSnapshot oku");
  try {
    const snap = await indexedDb.snapshots.get(INDEXED_SNAPSHOT_KEY);
    if (!snap?.data) { t.end({ empty: true }); return null; }
    const result = JSON.parse(snap.data) as DB;
    t.end({ version: result._version });
    return result;
  } catch (e) {
    t.end({ error: String(e) });
    logger.warn("db", "IndexedDB snapshot okunamadı", { error: String(e) });
    return null;
  }
}

function makeDefaultDB(): DB {
  const nowIso = new Date().toISOString();
  return {
    _version: 0,
    products: [],
    sales: [],
    suppliers: [],
    orders: [],
    cari: [],
    kasa: [],
    kasalar: [
      { id: "nakit", name: "Nakit", icon: "💵" },
      { id: "banka", name: "Banka", icon: "🏦" },
      { id: "pos_ziraat", name: "POS Ziraat", icon: "🏧" },
      { id: "pos_is", name: "POS İş", icon: "🏧" },
      { id: "pos_yk", name: "POS YapıKredi", icon: "🏧" },
    ] as Kasa[],
    bankTransactions: [],
    matchRules: [],
    monitorRules: [
      {
        id: genId(),
        isDefault: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        name: "Stok Tükendi Uyarısı",
        type: "stok_sifir",
        level: "critical",
        interval: 30,
        popup: true,
        active: true,
        threshold: 0,
      },
      {
        id: genId(),
        isDefault: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        name: "Düşük Stok Uyarısı",
        type: "stok_min",
        level: "warning",
        interval: 60,
        popup: true,
        active: true,
        threshold: undefined,
      },
      {
        id: genId(),
        isDefault: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        name: "Düşük Kasa Bakiyesi",
        type: "kasa_min",
        level: "warning",
        interval: 300,
        popup: true,
        active: true,
        threshold: 1000,
        kasa: "nakit",
      },
    ],
    monitorLog: [],
    stockMovements: [],
    peletSuppliers: [],
    peletOrders: [],
    boruSuppliers: [],
    boruOrders: [],
    invoices: [],
    budgets: [],
    returns: [],
    _activityLog: [],
    company: { id: genId(), createdAt: nowIso },
    settings: {},
    pelletSettings: { gramaj: 14, kgFiyat: 6.5, cuvalKg: 15, critDays: 3 },
    ortakEmanetler: [],
    installments: [],
    partners: [],
    productCategories: [
      { id: "soba", name: "Soba", icon: "🔥", createdAt: nowIso },
      { id: "aksesuar", name: "Aksesuar", icon: "🔧", createdAt: nowIso },
      { id: "yedek", name: "Yedek Parça", icon: "⚙️", createdAt: nowIso },
      { id: "boru", name: "Boru", icon: "🔩", createdAt: nowIso },
      { id: "pelet", name: "Pelet", icon: "🪵", createdAt: nowIso },
    ] as ProductCategory[],
    notes: [],
    _auditLog: [],
    aiActionLog: [],
  };
}

function loadFromStorage(): DB {
  const loadT = logger.time("db", "localStorage yükle");
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultDB();
    const parsed = JSON.parse(raw);
    const def = makeDefaultDB();
    const merged = { ...def, ...parsed };
    if (!merged.kasalar || merged.kasalar.length === 0)
      merged.kasalar = def.kasalar;
    const posIds = ["pos_ziraat", "pos_is", "pos_yk"];
    posIds.forEach((pid) => {
      if (!merged.kasalar.find((k: Kasa) => k.id === pid)) {
        const defKasa = def.kasalar.find((k) => k.id === pid);
        if (defKasa) merged.kasalar.push(defKasa);
      }
    });
    if (!merged.monitorRules || merged.monitorRules.length === 0)
      merged.monitorRules = def.monitorRules;
    if (!merged.pelletSettings) merged.pelletSettings = def.pelletSettings;
    if (!merged.company || typeof merged.company !== "object")
      merged.company = def.company;

    const arrayKeys: (keyof DB)[] = [
      "products", "sales", "suppliers", "orders", "cari", "kasa",
      "bankTransactions", "matchRules", "monitorLog", "stockMovements",
      "peletSuppliers", "peletOrders", "boruSuppliers", "boruOrders",
      "invoices", "budgets", "returns", "_activityLog", "ortakEmanetler",
      "installments", "partners", "notes", "_auditLog", "aiActionLog"
    ];
    arrayKeys.forEach((key) => {
      if (!Array.isArray(merged[key])) (merged as Record<string, unknown>)[key] = [];
    });

    if (
      !Array.isArray(merged.productCategories) ||
      merged.productCategories.length === 0
    )
      merged.productCategories = def.productCategories;
    loadT.end({ version: merged._version });
    return merged;
  } catch {
    loadT.end({ error: "parse" });
    return makeDefaultDB();
  }
}

let _isSaving = false;
let _pendingDb: DB | null = null;

function saveToStorage(db: DB): boolean {
  const t = logger.time("db", "localStorage yaz");
  if (_isSaving) {
    _pendingDb = db;
    return false;
  }
  _isSaving = true;
  try {
    db._version = (db._version || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    t.end({ version: db._version });
    return true;
  } catch (e) {
    t.end({ error: String(e) });
    return false;
  } finally {
    _isSaving = false;
    if (_pendingDb) {
      const pending = _pendingDb;
      _pendingDb = null;
      saveToStorage(pending);
    }
  }
}

export function useDB() {
  const [db, setDb] = useState<DB>(loadFromStorage);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    emitSync("loading");
    logger.info("db", "Uygulama DB yükleniyor", { localVersion: db._version });
    loadFromFirebase().then((cloudDb) => {
      if (!cloudDb) {
        logger.info("db", "Firebase boş, yerel veri kullanılıyor");
        return;
      }
      if ((cloudDb._version || 0) > (db._version || 0)) {
        logger.info("db", "Bulut verisi daha güncel — güncelleniyor", {
          local: db._version,
          cloud: cloudDb._version,
        });
        saveToStorage(cloudDb);
        void saveToIndexedSnapshot(cloudDb);
        setDb(cloudDb);
      } else {
        logger.info("db", "Yerel veri güncel", { version: db._version });
      }
      emitSync("idle");
    });

    if (!localStorage.getItem(STORAGE_KEY)) {
      void loadFromIndexedSnapshot().then((snap) => {
        if (!snap) return;
        saveToStorage(snap);
        setDb(snap);
        logger.info("db", "IndexedDB snapshot geri yüklendi", {
          version: snap._version,
        });
      });
    }
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const undoStackRef = useRef<DB[]>([]);
  const MAX_UNDO = 30;

  const save = useCallback((updater: (prev: DB) => DB) => {
    setDb((prev) => {
      const t = logger.time("db", "save()");

      if (isGuestSession()) {
        t.end({ version: prev._version, guestBlocked: true });
        logger.warn("db", "Misafir oturumunda kayıt engellendi");
        return prev;
      }

      let next = updater(prev);
      (next as DB & { _lastSyncAt?: string })._lastSyncAt =
        new Date().toISOString();
      if (next.stockMovements && next.stockMovements.length > 1000) {
        next = { ...next, stockMovements: next.stockMovements.slice(0, 1000) };
      }

      let violations: RuleViolation[] = [];
      try {
        violations = validateTransaction(prev, next);
      } catch (e) {
        logger.warn("db", "Rule Engine değerlendirme hatası — atlandı", {
          error: String(e),
        });
      }

      const hasBlock = violations.some((v) => v.severity === "block");
      const hasWarn = violations.some((v) => v.severity === "warn");
      const auditStatus = hasBlock ? "blocked" : hasWarn ? "warned" : "applied";

      const entry = createAuditEntry({
        action: "save",
        entity: "DB",
        prevDB: Object.freeze({ ...prev }),
        nextDB: next,
        status: auditStatus,
        violations: violations.length > 0 ? violations : undefined,
      });

      if (hasBlock) {
        const auditOnly: DB = {
          ...prev,
          _auditLog: trimAuditLog([entry, ...(prev._auditLog || [])]),
        };
        saveToStorage(auditOnly);
        void saveToIndexedSnapshot(auditOnly);
        t.end({ version: prev._version, blocked: true });
        logger.warn("db", "İşlem engellendi (block ihlali)", {
          violations: violations
            .filter((v) => v.severity === "block")
            .map((v) => v.ruleId),
        });
        return auditOnly;
      }

      // Capture prev snapshot for undo before applying the save
      {
        const stack = undoStackRef.current;
        undoStackRef.current = [
          ...stack.slice(-(MAX_UNDO - 1)),
          safeClone(prev),
        ];
      }

      const withAudit: DB = {
        ...next,
        _auditLog: trimAuditLog([entry, ...(next._auditLog || [])]),
      };
      saveToStorage(withAudit);
      void saveToIndexedSnapshot(withAudit);
      t.end({ version: withAudit._version, warned: hasWarn });

      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        saveToFirebase(withAudit);
      }, 1200);
      return withAudit;
    });
  }, []);

  const undo = useCallback((): boolean => {
    if (isGuestSession()) {
      logger.warn("db", "Misafir oturumunda geri alma engellendi");
      return false;
    }

    const stack = undoStackRef.current;
    if (stack.length === 0) return false;
    const target = stack.pop()!; 

    setDb((prev) => {
      const ut = logger.time("db", "undo()");
      const restored: DB = {
        ...target,
        _version: (prev._version || 0) + 1,
        _auditLog: trimAuditLog([
          createAuditEntry({
            action: "undo",
            entity: "DB",
            prevDB: prev,
            nextDB: target,
            status: "applied",
          }),
          ...(prev._auditLog || []),
        ]),
      };
      saveToStorage(restored);
      void saveToIndexedSnapshot(restored);
      ut.end({ version: restored._version });
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        saveToFirebase(restored);
      }, 1200);
      return restored;
    });
    return true;
  }, []);

  const clearUndoStack = useCallback(() => {
    undoStackRef.current = [];
  }, []);

  const logActivity = useCallback(
    (action: string, detail?: string) => {
      save((prev) => {
        const log = [
          {
            id: genId(),
            action,
            detail: detail || "",
            time: new Date().toISOString(),
          },
          ...(prev._activityLog || []),
        ].slice(0, 200);
        return { ...prev, _activityLog: log };
      });
    },
    [save],
  );

  const saveWithLog = useCallback(
    (updater: (prev: DB) => DB, action?: string, detail?: string) => {
      save((prev) => {
        let next = updater(prev);
        if (action) {
          const log = [
            {
              id: genId(),
              action,
              detail: detail || "",
              time: new Date().toISOString(),
            },
            ...(next._activityLog || []),
          ].slice(0, 200);
          next = { ...next, _activityLog: log };
        }
        return next;
      });
    },
    [save],
  );

  const saveGuarded = useCallback(
    (
      updater: (prev: DB) => DB,
      onViolation?: (violations: RuleViolation[]) => void,
      auditMeta?: {
        action: string;
        entity: string;
        entityId?: string;
        detail?: string;
      },
    ) => {
      if (isGuestSession()) {
        logger.warn("db", "Misafir oturumunda saveGuarded engellendi");
        return;
      }

      setDb((prev) => {
        const st = logger.time("db", "saveGuarded()");
        let next = updater(prev);
        (next as DB & { _lastSyncAt?: string })._lastSyncAt =
          new Date().toISOString();
        if (next.stockMovements && next.stockMovements.length > 1000) {
          next = {
            ...next,
            stockMovements: next.stockMovements.slice(0, 1000),
          };
        }

        let violations: RuleViolation[] = [];
        try {
          violations = validateTransaction(prev, next);
        } catch (e) {
          logger.warn("db", "saveGuarded: Rule Engine hatası — atlandı", {
            error: String(e),
          });
        }

        const hasBlock = violations.some((v) => v.severity === "block");
        const hasWarn = violations.some((v) => v.severity === "warn");

        if ((hasBlock || hasWarn) && onViolation) {
          try {
            onViolation(violations);
          } catch {
            /* callback hatası uygulamayı çökertmez */
          }
        }

        const auditStatus = hasBlock
          ? "blocked"
          : hasWarn
            ? "warned"
            : "applied";
        const entry = createAuditEntry({
          action: auditMeta?.action ?? "saveGuarded",
          entity: auditMeta?.entity ?? "DB",
          entityId: auditMeta?.entityId,
          prevDB: Object.freeze({ ...prev }),
          nextDB: next,
          status: auditStatus,
          violations: violations.length > 0 ? violations : undefined,
          detail: auditMeta?.detail,
        });

        if (hasBlock) {
          const auditOnly: DB = {
            ...prev,
            _auditLog: trimAuditLog([entry, ...(prev._auditLog || [])]),
          };
          saveToStorage(auditOnly);
          void saveToIndexedSnapshot(auditOnly);
          st.end({ version: prev._version, blocked: true });
          logger.warn("db", "saveGuarded: İşlem engellendi", {
            violations: violations
              .filter((v) => v.severity === "block")
              .map((v) => v.ruleId),
          });
          return auditOnly;
        }

        const withAudit: DB = {
          ...next,
          _auditLog: trimAuditLog([entry, ...(next._auditLog || [])]),
        };
        saveToStorage(withAudit);
        void saveToIndexedSnapshot(withAudit);
        st.end({ version: withAudit._version });
        if (syncTimer.current) clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => {
          saveToFirebase(withAudit);
        }, 1200);
        return withAudit;
      });
    },
    [],
  );

  const exportJSON = useCallback(async () => {
    const data = JSON.stringify(db, null, 2);
    const filename = `soba-yedek-${new Date().toISOString().slice(0, 10)}.json`;

    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        await Filesystem.writeFile({
          path: filename,
          data,
          directory: Directory.Documents,
          encoding: "utf8" as never,
        });
        alert(`✅ Yedek kaydedildi!\nKonum: Belgeler/${filename}`);
        return;
      }
    } catch {
      /* web fallback */
    }

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [db]);

  const manualBackup = useCallback(
    async (label?: string): Promise<boolean> => {
      return saveBackupToFirebase(
        db,
        label ||
          `manuel_${new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-")}`,
      );
    },
    [db],
  );

  const listBackups = useCallback(() => listBackupsFromFirebase(), []);

  const restoreBackup = useCallback(
    async (
      backupId: string,
    ): Promise<{ ok: boolean; report?: RestoreReport }> => {
      const preLabel = `onceki_${new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-")}`;
      await saveBackupToFirebase(db, preLabel).catch(() => logger.error('db', 'Geri yükleme öncesi yedek alınamadı'));

      const restored = await restoreBackupFromFirebase(backupId);
      if (!restored) return { ok: false };

      const def = makeDefaultDB();
      const { db: data, report } = fullRestoreDB(restored, def);
      setDb(data);
      saveToStorage(data);
      void saveToIndexedSnapshot(data);
      await saveToFirebase(data);
      return { ok: true, report };
    },
    [db],
  );

  const importJSON = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string);
          const def = makeDefaultDB();
          const { db: data } = fullRestoreDB(raw as DB, def);
          setDb(data);
          saveToStorage(data);
          void saveToIndexedSnapshot(data);
          saveToFirebase(data);
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const getKasaBakiye = useCallback(
    (kasaId: string) => {
      return db.kasa
        .filter((k) => !k.deleted && k.kasa === kasaId)
        .reduce((sum, k) => {
          return sum + (k.type === "gelir" ? k.amount : -k.amount);
        }, 0);
    },
    [db.kasa],
  );

  const getTotalKasa = useCallback(() => {
    return db.kasa
      .filter((k) => !k.deleted)
      .reduce((sum, k) => sum + (k.type === "gelir" ? k.amount : -k.amount), 0);
  }, [db.kasa]);

  return {
    db,
    save,
    saveWithLog,
    saveGuarded,
    logActivity,
    exportJSON,
    importJSON,
    getKasaBakiye,
    getTotalKasa,
    emitSync,
    manualBackup,
    listBackups,
    restoreBackup,
    undo,
    clearUndoStack,
  };
}
