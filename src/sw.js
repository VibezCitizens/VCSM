/* src/sw.js */
/* eslint-disable no-restricted-globals */
precacheAndRoute(self.__WB_MANIFEST || []);

// ---- Workbox precache injection (required for injectManifest) ----
import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST);
// ------------------------------------------------------------------

// ---------- tiny IndexedDB helper ----------
const DB_NAME = 'vcs-upload-db';
const STORE = 'jobs';

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbAdd(job) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(job);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbAll() {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(id) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- lifecycle ----------
self.addEventListener('install', () => {
  self.skipWaiting();
  console.log('SW installed ✅');
});
self.addEventListener('activate', (e) => {
  self.clients.claim();
  console.log('SW activated ✅');
});

// ---------- receive jobs from the app ----------
self.addEventListener('message', async (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'ENQUEUE_UPLOAD') {
    const job = msg.job; // { url, method, headers, fields, fileBlob, filename, contentType, body? }
    await idbAdd({ createdAt: Date.now(), ...job });

    // schedule background sync if available
    try {
      await self.registration.sync.register('vcs-upload');
      console.log('Sync registered');
    } catch (err) {
      console.warn('Sync registration failed; running immediately', err);
      event.waitUntil(processQueue());
    }
  }
});

// ---------- sync event: process queue ----------
self.addEventListener('sync', (event) => {
  if (event.tag === 'vcs-upload') {
    event.waitUntil(processQueue());
  }
});

// ---------- core uploader ----------
async function processQueue() {
  const jobs = await idbAll();
  if (!jobs.length) return;

  for (const job of jobs) {
    try {
      let body;
      let headers = job.headers || {};

      // Build multipart/form-data if fields + file provided
      if (job.fields || job.fileBlob) {
        const form = new FormData();
        if (job.fields && typeof job.fields === 'object') {
          for (const [k, v] of Object.entries(job.fields)) {
            form.append(k, String(v));
          }
        }
        if (job.fileBlob) {
          const file =
            job.fileBlob instanceof Blob
              ? job.fileBlob
              : new Blob([job.fileBlob], { type: job.contentType || 'application/octet-stream' });
          form.append('file', file, job.filename || `upload-${Date.now()}.mp4`);
        }
        body = form;
        // Let browser set correct multipart boundary
        headers = Object.fromEntries(
          Object.entries(headers).filter(([k]) => k.toLowerCase() !== 'content-type')
        );
      } else {
        body = job.body || null;
      }

      const res = await fetch(job.url, {
        method: job.method || 'POST',
        headers,
        body,
      });

      if (!res.ok) {
        // keep job so sync can retry later
        console.warn('Upload failed, will retry later', job.id, res.status);
        continue;
      }

      // Success: remove from queue
      await idbDelete(job.id);
      console.log('Uploaded & removed job', job.id);
    } catch (err) {
      console.warn('Upload error, will retry later', job.id, err);
      // keep job for next sync
    }
  }
}
