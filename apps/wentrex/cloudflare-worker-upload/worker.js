// worker.js
const ALLOWED_ORIGINS = [
  'https://vibezcitizens.com',
  'https://www.vibezcitizens.com',
];

if (typeof globalThis.process !== 'undefined' || typeof globalThis.MINIFLARE !== 'undefined') {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-requested-with',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json',
    },
  });
}

function normalizeFolder(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders(request) });
    }

    try {
      const form = await request.formData();
      const file = form.get('file');
      const key = String(form.get('key') || '').trim();
      const folder = normalizeFolder(form.get('folder'));

      const fallbackName = `upload-${Date.now()}.bin`;
      const fileName = String(file?.name || fallbackName).replace(/^\/+/, '');
      const objectKey = key || [folder, fileName].filter(Boolean).join('/');

      if (!file || !objectKey) {
        return jsonResponse(request, { error: 'Missing file or key' }, 400);
      }

      await env.R2_BUCKET.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });

      const publicUrl = `https://cdn.vibezcitizens.com/${objectKey}`;
      return jsonResponse(request, { url: publicUrl }, 200);
    } catch (err) {
      return jsonResponse(request, { error: err?.message || 'Upload failed' }, 500);
    }
  },
};
