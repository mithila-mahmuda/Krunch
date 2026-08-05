"use client";

import { DB_NAME, DB_VERSION, STORES, type StoreName } from "@/lib/db/schema";
import { migrateLegacyLocalStorage } from "@/lib/db/migrate-legacy";

let dbPromise: Promise<IDBDatabase> | null = null;
let migratePromise: Promise<void> | null = null;
let migrating = false;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open IndexedDB."));
  });
}

async function ensureOpen(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}

/** Lightweight IndexedDB handle — no WASM, opens in milliseconds. */
export async function getLocalDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    throw new Error("Local DB is browser-only.");
  }

  const db = await ensureOpen();

  if (!migrating) {
    if (!migratePromise) {
      migratePromise = (async () => {
        migrating = true;
        try {
          await migrateLegacyLocalStorage();
        } finally {
          migrating = false;
        }
      })();
    }
    await migratePromise;
  }

  return db;
}

export function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

export async function clearStore(
  db: IDBDatabase,
  storeName: StoreName,
): Promise<void> {
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).clear();
  await txDone(tx);
}

export async function putAll<T extends { id: string }>(
  db: IDBDatabase,
  storeName: StoreName,
  rows: T[],
): Promise<void> {
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.clear();
  for (const row of rows) {
    store.put(row);
  }
  await txDone(tx);
}

/**
 * Replace only one restaurant's rows; leave other tenants untouched.
 * Rows without restaurantId are treated as `legacyRestaurantId` when provided.
 */
export async function putTenantAll<T extends { id: string; restaurantId?: string }>(
  db: IDBDatabase,
  storeName: StoreName,
  restaurantId: string,
  rows: T[],
  legacyRestaurantId?: string,
): Promise<void> {
  const existing = await getAll<{ id: string; restaurantId?: string }>(
    db,
    storeName,
  );
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);

  for (const row of existing) {
    const belongs =
      row.restaurantId === restaurantId ||
      (!row.restaurantId && restaurantId === legacyRestaurantId);
    if (belongs) store.delete(row.id);
  }

  for (const row of rows) {
    store.put({ ...row, restaurantId });
  }
  await txDone(tx);
}

export async function getTenantAll<T extends { restaurantId?: string }>(
  db: IDBDatabase,
  storeName: StoreName,
  restaurantId: string,
  legacyRestaurantId?: string,
): Promise<T[]> {
  const all = await getAll<T>(db, storeName);
  return all.filter((row) => {
    if (row.restaurantId === restaurantId) return true;
    if (!row.restaurantId && restaurantId === legacyRestaurantId) return true;
    return false;
  });
}

export async function getAll<T>(
  db: IDBDatabase,
  storeName: StoreName,
): Promise<T[]> {
  const tx = db.transaction(storeName, "readonly");
  return idbRequest(tx.objectStore(storeName).getAll()) as Promise<T[]>;
}

export async function getById<T>(
  db: IDBDatabase,
  storeName: StoreName,
  id: string,
): Promise<T | undefined> {
  const tx = db.transaction(storeName, "readonly");
  return idbRequest(tx.objectStore(storeName).get(id)) as Promise<T | undefined>;
}

export async function putOne<T extends { id: string }>(
  db: IDBDatabase,
  storeName: StoreName,
  row: T,
): Promise<void> {
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).put(row);
  await txDone(tx);
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed."));
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted."));
  });
}
