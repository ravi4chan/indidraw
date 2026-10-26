import type { LibraryPersistenceAdapter } from "@excalidraw/excalidraw/data/library";

// Separate database avoids rewriting existing drawing records during upgrades.
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("indidraw-library", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("library");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Close other IndiDraw tabs and retry."));
  });
}
export const libraryAdapter: LibraryPersistenceAdapter = {
  async load() {
    const db = await database();
    try {
      return await new Promise((resolve, reject) => {
        const request = db
          .transaction("library")
          .objectStore("library")
          .get("items");
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  },
  async save(data) {
    const db = await database();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("library", "readwrite");
        tx.objectStore("library").put(data, "items");
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () =>
          reject(tx.error ?? new Error("Library save failed."));
      });
    } finally {
      db.close();
    }
  },
};
