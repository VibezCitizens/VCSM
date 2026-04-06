// worker.js
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
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
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
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
        return jsonResponse({ error: 'Missing file or key' }, 400);
      }

      await env.R2_BUCKET.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });

      const publicUrl = `https://cdn.vibezcitizens.com/${objectKey}`;
      return jsonResponse({ url: publicUrl }, 200);
    } catch (err) {
      return jsonResponse({ error: err?.message || 'Upload failed' }, 500);
    }
  },
};
