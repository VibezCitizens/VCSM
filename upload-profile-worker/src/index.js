export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file');
      const path = formData.get('path') || 'default';

      if (!file || !(file instanceof File)) {
        return new Response('Missing or invalid file', {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const fileName = `${crypto.randomUUID()}.${file.type.split('/')[1] || 'jpg'}`;
      const objectKey = `${path}/${fileName}`;

      await env.R2_BUCKET.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type },
      });

      const publicUrl = `${env.R2_PUBLIC_DOMAIN}/${objectKey}`;
      return Response.json({ url: publicUrl }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
