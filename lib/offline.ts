import { openDB, type IDBPDatabase } from "idb";
import type { SchemeMatch } from "@/lib/scheme-matcher";

const DB_NAME = "loksaathi-db";
const DB_VERSION = 1;
const STORE_NAME = "saved-schemes";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined" && typeof indexedDB === "undefined") {
    // In SSR without indexedDB mock
    return Promise.reject(new Error("IndexedDB is only available in browser"));
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "scheme.id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveScheme(match: SchemeMatch): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE_NAME, match);
  } catch (err) {
    console.error("Error saving scheme to IndexedDB:", err);
  }
}

export async function getSavedSchemes(): Promise<SchemeMatch[]> {
  try {
    const db = await getDb();
    return await db.getAll(STORE_NAME);
  } catch (err) {
    console.error("Error reading saved schemes from IndexedDB:", err);
    return [];
  }
}

export async function removeScheme(schemeId: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORE_NAME, schemeId);
  } catch (err) {
    console.error(`Error deleting scheme ${schemeId} from IndexedDB:`, err);
  }
}

export async function isSchemeSaved(schemeId: string): Promise<boolean> {
  try {
    const db = await getDb();
    const item = await db.get(STORE_NAME, schemeId);
    return !!item;
  } catch (err) {
    console.error(`Error checking if scheme ${schemeId} is saved:`, err);
    return false;
  }
}

export async function clearAllSchemes(): Promise<void> {
  try {
    const db = await getDb();
    await db.clear(STORE_NAME);
  } catch (err) {
    console.error("Error clearing saved schemes:", err);
  }
}
