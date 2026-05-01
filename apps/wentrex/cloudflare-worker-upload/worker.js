// worker.js

const ALLOWED_ORIGINS = [
  'https://vibezcitizens.com',
  'https://www.vibezcitizens.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-requested-with',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

// ------------------------------------------------------------
// JSON helper
// ------------------------------------------------------------
function jsonResponse(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json',
    },
  });
}

// ------------------------------------------------------------
// Utils
// ------------------------------------------------------------
function normalizeFolder(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

// ------------------------------------------------------------
// Worker
// ------------------------------------------------------------
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // Optional strict reject (helps debugging & security)
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    // Only POST allowed
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders(request),
      });
    }

    try {
      const form = await request.formData();
      const file = form.get('file');
      const key = String(form.get('key') || '').trim();
      const folder = normalizeFolder(form.get('folder'));

      if (!file) {
        return jsonResponse(request, { error: 'Missing file' }, 400);
      }

      const fallbackName = `upload-${Date.now()}.bin`;

      const safeName = String(file.name || fallbackName)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/^_+/, '');

      const objectKey = key || [folder, safeName].filter(Boolean).join('/');

      if (!objectKey) {
        return jsonResponse(request, { error: 'Missing object key' }, 400);
      }

      // Upload to R2
      await env.R2_BUCKET.put(objectKey, file.stream(), {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
        },
      });

      const publicUrl = `https://cdn.vibezcitizens.com/${objectKey}`;

      return jsonResponse(request, { url: publicUrl }, 200);
    } catch (err) {
      return jsonResponse(
        request,
        { error: err?.message || 'Upload failed' },
        500
      );
    }
  },
};