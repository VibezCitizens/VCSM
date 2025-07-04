// src/lib/uploadToCloudflare.js
// This file provides a reusable function to upload files to Cloudflare R2 via your custom Worker endpoint.

const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';
const R2_PUBLIC = 'https://cdn.vibezcitizens.com'; // Your public R2 domain for constructing fallback URLs

/**
 * Uploads a file (Blob or File object) to Cloudflare R2 via a custom upload endpoint.
 *
 * @param {File | Blob} file The file or blob to upload.
 * @param {string} key The desired key (path) for the file in R2, e.g., 'chat/conversationId/timestamp-filename.jpg' or 'posts/userId/timestamp-filename.jpg'.
 * @returns {Promise<{url: string | null, error: string | null}>} An object containing the URL of the uploaded file or an error message.
 */
export async function uploadToCloudflare(file, key) {
  try {
    const form = new FormData();
    // Append the file, using the last part of the key as the filename for the FormData part.
    // The worker primarily uses the 'key' field for the R2 put operation.
    form.append('file', file, key.split('/').pop());
    // Append the full R2 object key (path) that the worker will use.
    form.append('key', key);

    const res = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      const errorText = await res.text();
      // If the worker sends a useful error message, return it.
      // Otherwise, provide a generic 'Upload failed.'
      return { url: null, error: errorText || 'Upload failed.' };
    }

    // Assuming your Cloudflare Worker returns a JSON object with a 'url' field on success.
    const result = await res.json();
    const url = result.url || `${R2_PUBLIC}/${key}`; // Fallback to constructing URL if not directly returned

    if (!url) {
      return { url: null, error: 'Upload successful, but no URL was returned or could be constructed.' };
    }

    return { url, error: null };
  } catch (err) {
    console.error('Error in uploadToCloudflare utility:', err);
    return { url: null, error: err.message || 'An unexpected error occurred during upload.' };
  }
}