export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file');
      const path = formData.get('path') || 'default';

      if (!file || !(file instanceof File)) {
        return new Response('Missing or invalid file', { status: 400 });
      }

      const fileName = `${crypto.randomUUID()}.${file.type.split('/')[1] || 'jpg'}`;
      const objectKey = `${path}/${fileName}`;

      await env.R2_BUCKET.put(objectKey, file.stream(), {
        httpMetadata: { contentType: file.type },
      });

      const publicUrl = `${env.R2_PUBLIC_DOMAIN}/${objectKey}`;
      return Response.json({ url: publicUrl });
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
};
