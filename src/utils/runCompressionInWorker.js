// src/utils/runCompressionInWorker.js
export function runCompressionInWorker(file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const jobId = crypto.randomUUID();
    const worker = new Worker('/workers/compress.worker.js', { type: 'module' });

    worker.onmessage = (e) => {
      const msg = e.data || {};
      if (msg.type === 'progress' && typeof onProgress === 'function') onProgress(msg.pct);
      if (msg.type === 'done') {
        worker.terminate();
        resolve(new File([msg.blob], `compressed-${Date.now()}-${file.name}`, { type: 'video/mp4' }));
      }
      if (msg.type === 'error') {
        worker.terminate();
        reject(new Error(msg.error || 'Compression failed'));
      }
    };

    worker.postMessage({ file, jobId });
  });
}
