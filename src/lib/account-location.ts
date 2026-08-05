/**
 * Active branch/till is account-specific (who is signed in),
 * not device-specific (which browser/tablet this is).
 */

export interface AccountLocationPrefs {
  activeBranchId: string;
  activeTillId: string;
}

const PREFS_KEY = "krunch-account-location-prefs";

type PrefsMap = Record<string, AccountLocationPrefs>;

function readMap(): PrefsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as PrefsMap;
  } catch {
    return {};
  }
}

function writeMap(map: PrefsMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(map));
  } catch {
    // Private mode / quota — session fields still cover the active login.
  }
}

export function readAccountLocation(
  accountId: string,
): AccountLocationPrefs | null {
  const row = readMap()[accountId];
  if (!row?.activeBranchId || !row?.activeTillId) return null;
  return {
    activeBranchId: row.activeBranchId,
    activeTillId: row.activeTillId,
  };
}

export function writeAccountLocation(
  accountId: string,
  prefs: AccountLocationPrefs,
) {
  const map = readMap();
  map[accountId] = {
    activeBranchId: prefs.activeBranchId,
    activeTillId: prefs.activeTillId,
  };
  writeMap(map);
}
