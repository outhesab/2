import { getBrandVersion } from "@/config/brand";
import { CHANGELOG } from "./changelog";
import { loadAppConfig, validateVersion } from "./appConfig";

export const VERSION = getBrandVersion();

export const VERSION_DATE = CHANGELOG[0]?.date || "";

export const VERSION_TITLE = CHANGELOG[0]?.title || "";

export function getAppVersion(): string {
  return VERSION;
}

export function getVersionDate(): string {
  return VERSION_DATE;
}

export function getVersionTitle(): string {
  return VERSION_TITLE;
}

export function getDBVersion(): number {
  try {
    const raw = localStorage.getItem("sobaYonetim_db");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed._version || 0;
    }
  } catch {
    // ignore
  }
  return 0;
}

export function getConfigVersion(): string {
  return loadAppConfig().version || VERSION;
}

export function validateVersionFormat(v: string): boolean {
  return validateVersion(v);
}

export function isVersionGte(current: string, target: string): boolean {
  const c = current.split(".").map(Number);
  const t = target.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const a = c[i] || 0;
    const b = t[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

export function getVersionInfo() {
  return {
    app: VERSION,
    date: VERSION_DATE,
    title: VERSION_TITLE,
    db: getDBVersion(),
    config: getConfigVersion(),
  };
}
