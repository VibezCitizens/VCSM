// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

// src/lib/uploadToCloudflare.js
import { supabase } from '@/services/supabase/supabaseClient';

// If you add auth later, you can inject a Bearer token here (or via headers in getBackgroundJob)
export const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';
export const R2_PUBLIC = 'https://cdn.vibezcitizens.com'; // Your public R2 domain

async function getUploadAuthHeaders() {
  try {
    let token = null;

    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token ?? null;

    if (!token) {
      const wandersClient = globalThis?.__WANDERS_SB__;
      if (wandersClient?.auth?.getSession) {
        const { data: wandersData } = await wandersClient.auth.getSession();
        token = wandersData?.session?.access_token ?? null;
      }
    }

    if (!token) {
      return { 'x-requested-with': 'vc-web' };
    }

    return {
      Authorization: `Bearer ${token}`,
      'x-requested-with': 'vc-web',
    };
  } catch {
    return { 'x-requested-with': 'vc-web' };
  }
}

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

    const authHeaders = await getUploadAuthHeaders();

    const res = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: form,
      headers: authHeaders,
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
 * @param {{ authToken?: string }} [options]
 * @returns {{url:string, method:string, headers:Object, fields:Object, filename:string, contentType:string, publicUrl:string}}
 */
export function getBackgroundJob(file, key, options = {}) {
  const filename = (key.split('/').pop()) || 'upload.bin';
  const path = key.split('/').slice(0, -1).join('/');
  const token = String(options?.authToken || '').trim();

  return {
    url: UPLOAD_ENDPOINT,
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-requested-with': 'vc-web',
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
