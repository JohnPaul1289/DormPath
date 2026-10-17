const openDB = () =>
  new Promise((resolve, reject) => {
    const r = indexedDB.open("dormpath", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("data");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
export async function cached(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      "data",
      value === undefined ? "readonly" : "readwrite",
    );
    const req =
      value === undefined
        ? tx.objectStore("data").get(key)
        : tx.objectStore("data").put(value, key);
    tx.oncomplete = () => {
      resolve(req.result);
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}
export async function clearPrivate() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("data", "readwrite");
    const req = tx.objectStore("data").openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (c) {
        if (!String(c.key).startsWith("public:")) c.delete();
        c.continue();
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
export const privateEnabled = () =>
  localStorage.getItem("dormpath-private-cache") === "true";
