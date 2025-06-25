const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return new Response("Unsupported Media Type", { status: 415, headers: corsHeaders });
      }

      const formData = await request.formData();
      const file = formData.get("file");
      const customKey = formData.get("key");

      if (!file || typeof file.name !== "string") {
        return new Response("Invalid file", { status: 400, headers: corsHeaders });
      }

      const ext = file.name.split('.').pop();
      const key = typeof customKey === "string" && customKey.trim()
        ? customKey
        : `profile_${Date.now()}.${ext}`;

      await env.R2_BUCKET.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
      });

      const publicUrl = `${env.R2_PUBLIC_DOMAIN}/${key}`;
      return new Response(JSON.stringify({ url: publicUrl }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      return new Response("Upload failed: " + err.message, {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
