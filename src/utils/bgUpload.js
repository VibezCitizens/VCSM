// src/utils/bgUpload.js
export async function enqueueUpload(job) {
  // job: { url, method, headers, fields, fileBlob, filename, contentType }
  if (!('serviceWorker' in navigator)) throw new Error('SW not supported');
  const reg = await navigator.serviceWorker.ready;
  const sw = reg.active || reg.waiting || reg.installing;
  if (!sw) throw new Error('No active service worker');
  sw.postMessage({ type: 'ENQUEUE_UPLOAD', job });
}
