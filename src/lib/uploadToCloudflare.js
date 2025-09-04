// src/lib/uploadToCloudflare.js

// If you add auth later, you can inject a Bearer token here (or via headers in getBackgroundJob)
export const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';
export const R2_PUBLIC = 'https://cdn.vibezcitizens.com'; // Your public R2 domain

/** Build a deterministic public URL from a storage key. */
export function publicUrlForKey(key) {
  // Ensure no leading slash
  const clean = String(key || '').replace(/^\/+/, '');
  return `${R2_PUBLIC}/${clean}`;
}

/**
 * Uploads a file to Cloudflare R2 via your Worker (direct / foreground path).
 *
 * @param {File|Blob} file - The file to upload.
 * @param {string} key - Full key (e.g., 'posts/userId/timestamp.mp4').
 * @returns {Promise<{url: string | null, error: string | null}>}
 */
export async function uploadToCloudflare(file, key) {
  try {
    const form = new FormData();
    const filename = (key.split('/').pop()) || 'upload.bin';
    const path = key.split('/').slice(0, -1).join('/');

    form.append('file', file, filename); // Worker expects "file"
    form.append('key', key);             // Full object key
    form.append('path', path);           // Folder prefix (if your Worker uses it)

    const res = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: form,
      // headers: { Authorization: `Bearer ${YOUR_TOKEN}` }, // if needed later
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { url: null, error: errorText || 'Upload failed.' };
    }

    const result = await res.json().catch(() => ({}));
    // Prefer Worker-returned URL; fall back to deterministic public URL
    const url = result.url || publicUrlForKey(key);
    return { url, error: null };
  } catch (err) {
    console.error('Error uploading to Cloudflare:', err);
    return { url: null, error: err?.message || 'Unexpected upload error.' };
  }
}

/**
 * Background-upload adapter for the Service Worker.
 * The SW expects a "job" payload with: { url, method, headers, fields, filename, contentType, publicUrl }
 * We DO NOT include the file blob here; the caller (uploadFlow) passes the actual File/Blob to enqueueUpload().
 *
 * @param {File|Blob} file
 * @param {string} key
 * @returns {{url:string, method:string, headers:Object, fields:Object, filename:string, contentType:string, publicUrl:string}}
 */
export function getBackgroundJob(file, key) {
  const filename = (key.split('/').pop()) || 'upload.bin';
  const path = key.split('/').slice(0, -1).join('/');

  return {
    url: UPLOAD_ENDPOINT,
    method: 'POST',
    headers: {
      // Add auth here if your Worker requires it, e.g.:
      // Authorization: `Bearer ${YOUR_TOKEN}`,
      // Let the browser set multipart boundary — don't set Content-Type
    },
    fields: {
      key,
      path,
      // Any other form fields your Worker supports can go here
    },
    filename,
    contentType: (file && file.type) || 'application/octet-stream',
    publicUrl: publicUrlForKey(key),
  };
}

// allow default imports too
export default uploadToCloudflare;
