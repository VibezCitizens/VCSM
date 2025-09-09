/* src/sw.js */
/// <reference lib="WebWorker" />
/* eslint-disable no-restricted-globals */

// ── Workbox precache (injectManifest) ─────────────────────────
import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST);
// ──────────────────────────────────────────────────────────────


// =============================================================
//  A) BACKGROUND UPLOAD QUEUE (what you already had)
// =============================================================
const UP_DB = 'vcs-upload-db';
const UP_STORE = 'jobs';

function upOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(UP_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(UP_STORE)) {
        db.createObjectStore(UP_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function upAdd(job) {
  const db = await upOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UP_STORE, 'readwrite');
    tx.objectStore(UP_STORE).add(job);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function upAll() {
  const db = await upOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UP_STORE, 'readonly');
    const req = tx.objectStore(UP_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function upDelete(id) {
  const db = await upOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UP_STORE, 'readwrite');
    tx.objectStore(UP_STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

self.addEventListener('install', () => {
  self.skipWaiting();
  console.log('[SW] installed ✅');
});
self.addEventListener('activate', () => {
  self.clients.claim();
  console.log('[SW] activated ✅');
});

self.addEventListener('message', async (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  // enqueue background upload
  if (msg.type === 'ENQUEUE_UPLOAD') {
    await upAdd({ createdAt: Date.now(), ...msg.job });
    try {
      await self.registration.sync.register('vcs-upload');
      console.log('[SW] sync registered');
    } catch (err) {
      console.warn('[SW] sync registration failed; running immediately', err);
      event.waitUntil(processUploadQueue());
    }
  }

  // clear app badge from page (when user opens notifications)
  if (msg.type === 'BADGE_CLEAR') {
    try {
      if ('clearAppBadge' in self.registration) {
        // @ts-ignore
        await self.registration.clearAppBadge();
      }
    } catch {}
  }

  // mark one or more cached notifs as read
  if (msg.type === 'NOTIF_MARK_READ' && Array.isArray(msg.ids)) {
    await notifMarkReadMany(msg.ids);
    await updateBadgeFromCache();
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'vcs-upload') {
    event.waitUntil(processUploadQueue());
  }
});

async function processUploadQueue() {
  const jobs = await upAll();
  if (!jobs.length) return;

  for (const job of jobs) {
    try {
      let body;
      let headers = job.headers || {};

      if (job.fields || job.fileBlob) {
        const form = new FormData();
        if (job.fields && typeof job.fields === 'object') {
          for (const [k, v] of Object.entries(job.fields)) form.append(k, String(v));
        }
        if (job.fileBlob) {
          const file =
            job.fileBlob instanceof Blob
              ? job.fileBlob
              : new Blob([job.fileBlob], { type: job.contentType || 'application/octet-stream' });
          form.append('file', file, job.filename || `upload-${Date.now()}.mp4`);
        }
        body = form;
        headers = Object.fromEntries(
          Object.entries(headers).filter(([k]) => k.toLowerCase() !== 'content-type')
        );
      } else {
        body = job.body || null;
      }

      const res = await fetch(job.url, { method: job.method || 'POST', headers, body });
      if (!res.ok) {
        console.warn('[SW] Upload failed, will retry later', job.id, res.status);
        continue;
      }
      await upDelete(job.id);
      console.log('[SW] Uploaded & removed job', job.id);
    } catch (err) {
      console.warn('[SW] Upload error, will retry later', job.id, err);
    }
  }
}


// =============================================================
//  B) NOTIFICATIONS CACHE + BADGING (PWA)
// =============================================================

// separate tiny store for notifications
const N_DB = 'vcs-notifs-db';
const N_STORE = 'notifs';

function nOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(N_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(N_STORE)) {
        const store = db.createObjectStore(N_STORE, { keyPath: 'id' });
        store.createIndex('read_idx', 'read', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function notifPut(obj) {
  const db = await nOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(N_STORE, 'readwrite');
    tx.objectStore(N_STORE).put(obj);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function notifAll() {
  const db = await nOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(N_STORE, 'readonly');
    const req = tx.objectStore(N_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function notifMarkReadMany(ids) {
  const db = await nOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(N_STORE, 'readwrite');
    const store = tx.objectStore(N_STORE);
    ids.forEach(async (id) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const row = getReq.result;
        if (row) store.put({ ...row, read: true });
      };
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function unreadTotal() {
  const all = await notifAll();
  return all.filter(n => !n.read).length;
}
async function updateBadgeFromCache() {
  try {
    const n = await unreadTotal();
    if ('setAppBadge' in self.registration && 'clearAppBadge' in self.registration) {
      // @ts-ignore
      n > 0 ? await self.registration.setAppBadge(n) : await self.registration.clearAppBadge();
    } else {
      // fallback: ping all clients (window can call navigator.setAppBadge)
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clientsList.forEach(c => c.postMessage({ type: 'badge:update', count: n }));
    }
  } catch {}
}

// Receive push → store, badge, show OS notification, notify pages
self.addEventListener('push', (event) => {
  const payload = (() => {
    try { return event.data?.json() || {}; } catch { return { body: event.data?.text() }; }
  })();

  const id = payload.id || `${Date.now()}`;
  const notif = {
    id,
    title: payload.title || 'New notification',
    body: payload.body || '',
    url:  payload.url  || '/notifications',
    created_at: payload.created_at || new Date().toISOString(),
    read: false,
  };

  event.waitUntil((async () => {
    await notifPut(notif);
    await updateBadgeFromCache();

    await self.registration.showNotification(notif.title, {
      body: notif.body,
      tag:  payload.tag || id,
      icon: payload.icon  || '/icons/icon-192.png',
      badge: payload.badge || '/icons/badge-72.png',
      data: { url: notif.url, id },
    });

    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clientsList.forEach(c => c.postMessage({ type: 'notif:new', notif }));
  })());
});

// Click → focus/open app and deep-link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/notifications';

  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) {
        await c.focus();
        c.postMessage({ type: 'notif:navigate', url });
        return;
      }
    }
    await clients.openWindow(url);
  })());
});
