// worker.js
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const form = await request.formData();
      const file = form.get('file');
      const key  = form.get('key');

      if (!file || !key) {
        return new Response(JSON.stringify({ error: 'Missing file or key' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Upload file to R2
      await env.R2_BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });

      // ✅ Always return your vanity CDN domain, NOT the r2.dev URL
      const publicUrl = `https://cdn.vibezcitizens.com/${key}`;

      return new Response(JSON.stringify({ url: publicUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
