// Supabase Edge Function: reverse-geocode
// City-level reverse geocoding + manual search (Twitter / Instagram style)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ============================
// CORS (REQUIRED)
// ============================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

type Address = {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  region?: string;
};

serve(async (req) => {
  // ✅ Handle browser preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");
    const search = url.searchParams.get("search");

    // ============================================================
    // 🔍 MANUAL CITY SEARCH (?search=)
    // ============================================================
    if (search) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&city=${encodeURIComponent(
          search
        )}`,
        {
          headers: {
            "User-Agent": "VCSM/1.0 (contact@yourdomain.com)",
          },
        }
      );

      if (!res.ok) {
        return json({ results: [] });
      }

      const data = await res.json();

      const results = (Array.isArray(data) ? data : [])
        .map((p) => p.display_name)
        .filter(Boolean);

      return json(
        { results },
        200,
        { "Cache-Control": "public, max-age=3600" }
      );
    }

    // ============================================================
    // 🌍 IP FALLBACK (no GPS)
    // ============================================================
    if (!lat || !lon) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

      if (!ip) {
        return json({ location: null });
      }

      const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const ipData = await ipRes.json();

      const label = [ipData.city, ipData.region]
        .filter(Boolean)
        .join(", ");

      return json({ location: label || null });
    }

    // ============================================================
    // 📍 GPS REVERSE GEOCODE
    // ============================================================
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          "User-Agent": "VCSM/1.0 (contact@yourdomain.com)",
        },
      }
    );

    if (!geoRes.ok) {
      return json({ location: null });
    }

    const data = await geoRes.json();
    const addr: Address = data?.address ?? {};

    const city = addr.city || addr.town || addr.village || "";
    const region = addr.state || addr.region || "";

    const label = [city, region].filter(Boolean).join(", ");

    return json(
      { location: label || null },
      200,
      { "Cache-Control": "public, max-age=86400" }
    );
  } catch (err) {
    console.error("[reverse-geocode]", err);
    return json({ location: null }, 500);
  }
});

// ============================
// helper
// ============================
function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...headers,
    },
  });
}
