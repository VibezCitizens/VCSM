// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

// src/lib/uploadToCloudflare.js
import { supabase } from '@/services/supabase/supabaseClient';
import { bugBunnyUploadStep, bugBunnyUploadError } from '@debuggers/media/bugBunnyUploadDebugger';

export const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';
export const R2_PUBLIC = 'https://cdn.vibezcitizens.com';

async function getUploadAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token ?? null;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

/** Build a deterministic public URL from a storage key. */
export function publicUrlForKey(key) {
  const clean = String(key || '').replace(/^\/+/, '');
  return `${R2_PUBLIC}/${clean}`;
}

/**
 * Uploads a file to Cloudflare R2 via the Worker (direct / foreground path).
 * Always sends an Authorization header — the Worker enforces JWT verification
 * and actor ownership before accepting the upload.
 *
 * @param {File|Blob} file
 * @param {string} key - Full R2 object key (e.g. 'vibes/{actorId}/2026/05/01/{uuid}.jpg')
 * @returns {Promise<{url: string | null, error: string | null}>}
 */
export async function uploadToCloudflare(file, key) {
  try {
    const form = new FormData();
    const filename = (key.split('/').pop()) || 'upload.bin';
    const path = key.split('/').slice(0, -1).join('/');

    form.append('file', file, filename);
    form.append('key', key);
    form.append('path', path);

    const authHeaders = await getUploadAuthHeaders();
    bugBunnyUploadStep('cloudflare', 'upload:preflight', {
      key,
      hasAuth: !!authHeaders?.Authorization,
      endpoint: UPLOAD_ENDPOINT,
    });

    const res = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: form,
      headers: authHeaders,
    });

    if (!res.ok) {
      const errorText = await res.text();
      bugBunnyUploadError('cloudflare', 'upload:http-error', new Error(errorText), { key, status: res.status });
      return { url: null, error: errorText || 'Upload failed.' };
    }

    const result = await res.json().catch(() => ({}));
    const url = result.url || publicUrlForKey(key);
    bugBunnyUploadStep('cloudflare', 'upload:success', { key, url });
    return { url, error: null };
  } catch (err) {
    bugBunnyUploadError('cloudflare', 'upload:fatal', err, { key });
    console.error('Error uploading to Cloudflare:', err);
    return { url: null, error: err?.message || 'Unexpected upload error.' };
  }
}

/**
 * Background-upload adapter for the Service Worker.
 * Caller must pass the current Supabase access token via options.authToken.
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
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    fields: { key, path },
    filename,
    contentType: (file && file.type) || 'application/octet-stream',
    publicUrl: publicUrlForKey(key),
  };
}

export default uploadToCloudflare;
