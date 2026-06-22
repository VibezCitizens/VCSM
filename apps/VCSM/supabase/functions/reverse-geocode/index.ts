// Supabase Edge Function: reverse-geocode
// City-level reverse geocoding + manual search (Twitter / Instagram style)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ============================
// CORS
// ============================
const BASE_ORIGIN = "https://vibezcitizens.com";

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const extra = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const allowed = new Set([BASE_ORIGIN, ...extra]);
  const origin = (requestOrigin && allowed.has(requestOrigin)) ? requestOrigin : BASE_ORIGIN;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
  };
}

// User-Agent for Nominatim API (required per usage policy: https://operations.osmfoundation.org/policies/nominatim/)
const NOMINATIM_USER_AGENT = `VCSM/1.0 (${Deno.env.get("CONTACT_EMAIL") ?? "noreply@vibezcitizens.com"})`;

// Basic validation: reject obviously spoofed / private IPs before forwarding to ipapi.co.
// Private ranges: 10.x, 172.16-31.x, 192.168.x, 127.x, loopback, link-local.
const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1|fe80:)/i;

function isSafePublicIp(ip: string): boolean {
  return Boolean(ip) && !PRIVATE_IP_RE.test(ip.trim());
}

type Address = {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  region?: string;
};

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = getCorsHeaders(origin);

  // ✅ Handle browser preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
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
            "User-Agent": NOMINATIM_USER_AGENT,
          },
        }
      );

      if (!res.ok) {
        return json({ results: [] }, 200, {}, cors);
      }

      const data = await res.json();

      const results = (Array.isArray(data) ? data : [])
        .map((p) => p.display_name)
        .filter(Boolean);

      return json({ results }, 200, { "Cache-Control": "public, max-age=3600" }, cors);
    }

    // ============================================================
    // 🌍 IP FALLBACK (no GPS)
    // ============================================================
    if (!lat || !lon) {
      const rawIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

      // Reject private/loopback IPs to prevent internal SSRF via ipapi.co proxy.
      if (!rawIp || !isSafePublicIp(rawIp)) {
        return json({ location: null }, 200, {}, cors);
      }

      const ipRes = await fetch(`https://ipapi.co/${encodeURIComponent(rawIp)}/json/`);
      const ipData = await ipRes.json();

      const label = [ipData.city, ipData.region]
        .filter(Boolean)
        .join(", ");

      return json({ location: label || null }, 200, {}, cors);
    }

    // ============================================================
    // 📍 GPS REVERSE GEOCODE
    // ============================================================
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          "User-Agent": NOMINATIM_USER_AGENT,
        },
      }
    );

    if (!geoRes.ok) {
      return json({ location: null }, 200, {}, cors);
    }

    const data = await geoRes.json();
    const addr: Address = data?.address ?? {};

    const city = addr.city || addr.town || addr.village || "";
    const region = addr.state || addr.region || "";

    const label = [city, region].filter(Boolean).join(", ");

    return json({ location: label || null }, 200, { "Cache-Control": "public, max-age=86400" }, cors);
  } catch (err) {
    console.error("[reverse-geocode]", err);
    return json({ location: null }, 500, {}, cors);
  }
});

// ============================
// helper
// ============================
function json(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
  cors: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...cors,
      ...extraHeaders,
    },
  });
}
