// src/utils/uploadQueue.js
const DB = 'uploads-db', BLOBS = 'blobs', JOBS = 'jobs';

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
      if (!db.objectStoreNames.contains(JOBS)) db.createObjectStore(JOBS, { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function stageUpload(file) {
  const db = await openDB();
  const jobId = crypto.randomUUID();

  await new Promise((res, rej) => {
    const tx = db.transaction([BLOBS, JOBS], 'readwrite');
    tx.objectStore(BLOBS).put(file, jobId);
    tx.objectStore(JOBS).put({ id: jobId, name: file.name, type: file.type, state: 'queued', createdAt: Date.now() });
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });

  // poke SW to enqueue
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'enqueue-upload', jobId });
  }
  return jobId;
}
