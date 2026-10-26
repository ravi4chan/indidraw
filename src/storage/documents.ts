export interface Drawing {
  id: string;
  title: string;
  updatedAt: number;
  scene: string;
  revision: number;
}
const DB = "indidraw";
let connection: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("drawings", { keyPath: "id" });
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          connection = undefined;
        };
        resolve(database);
      };
      request.onerror = () => {
        connection = undefined;
        reject(request.error ?? new Error("Local storage is unavailable."));
      };
      request.onblocked = () => {
        connection = undefined;
        reject(new Error("Close other IndiDraw tabs and retry."));
      };
    });
  return connection;
}
export async function saveDrawing(
  drawing: Drawing,
  expectedRevision?: number | null,
): Promise<void> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction("drawings", "readwrite");
    const store = tx.objectStore("drawings");
    const read = store.get(drawing.id);
    read.onsuccess = () => {
      const current = read.result as Drawing | undefined;
      if (
        (expectedRevision !== undefined &&
          (current?.revision ?? null) !== expectedRevision) ||
        (current && current.revision >= drawing.revision)
      ) {
        tx.abort();
        return;
      }
      store.put(drawing);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not save drawing."));
    tx.onabort = () =>
      reject(
        tx.error ??
          new Error(
            "This drawing changed in another tab. Export your unsaved work as a backup, then reload to open the saved version.",
          ),
      );
  });
}
export async function listDrawings(): Promise<Drawing[]> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const req = database
      .transaction("drawings", "readonly")
      .objectStore("drawings")
      .getAll();
    req.onsuccess = () =>
      resolve(
        (req.result as Drawing[]).sort((a, b) => b.updatedAt - a.updatedAt),
      );
    req.onerror = () => reject(req.error);
  });
}
export async function getDrawing(id: string): Promise<Drawing | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const req = database
      .transaction("drawings", "readonly")
      .objectStore("drawings")
      .get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export function saveError(error: unknown): string {
  return error instanceof DOMException && error.name === "QuotaExceededError"
    ? "Device storage is full. Export your drawing as a backup, then free some space."
    : error instanceof Error
      ? error.message
      : "Local save failed. Export a backup before closing this tab.";
}
