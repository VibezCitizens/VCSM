// src/lib/uploadToCloudflare.js
const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';
const R2_PUBLIC = 'https://cdn.vibezcitizens.com'; // Your public R2 domain

/**
 * Uploads a file to Cloudflare R2 via your Worker.
 *
 * @param {File | Blob} file - The file to upload.
 * @param {string} key - Full key (e.g., 'posts/userId/timestamp.mp4').
 * @returns {Promise<{url: string | null, error: string | null}>}
 */
export async function uploadToCloudflare(file, key) {
  try {
    const form = new FormData();
    const filename = key.split('/').pop();
    const path = key.split('/').slice(0, -1).join('/');

    form.append('file', file, filename);
    form.append('key', key);     // Full key used by Worker to name object
    form.append('path', path);   // Folder prefix used by Worker

    const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: form });

    if (!res.ok) {
      const errorText = await res.text();
      return { url: null, error: errorText || 'Upload failed.' };
    }

    const result = await res.json();
    const url = result.url || `${R2_PUBLIC}/${key}`;
    return { url, error: null };
  } catch (err) {
    console.error('Error uploading to Cloudflare:', err);
    return { url: null, error: err.message || 'Unexpected upload error.' };
  }
}

// allow default imports too
export default uploadToCloudflare;
