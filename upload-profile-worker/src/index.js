export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://vibezcitizens.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        const pathInput = formData.get('path') || 'default';

        if (!file || !(file instanceof File)) {
          return new Response('Missing or invalid file', {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/plain',
            },
          });
        }

        if (file.size > 10 * 1024 * 1024) {
          return new Response('File too large', {
            status: 413,
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/plain',
            },
          });
        }

        const safePath = pathInput.replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 128);
        const ext = file.type.split('/')[1] || 'jpg';
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const objectKey = `${safePath}/${fileName}`;

        await env.R2_BUCKET.put(objectKey, file.stream(), {
          httpMetadata: { contentType: file.type },
        });

        const url = `${env.R2_PUBLIC_DOMAIN}/${objectKey}`;

        return new Response(JSON.stringify({
          url,
          fileName,
          contentType: file.type,
          size: file.size,
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        return new Response(`Upload failed: ${err.message}`, {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain',
          },
        });
      }
    }

    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
      },
    });
  }
};
