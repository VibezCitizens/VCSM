/**
 * IDOR / RLS control tester for your own Supabase project.
 *
 * Run:
 *   SUPABASE_URL="https://nkdrjlmbtqbywhcthppm.supabase.co" \
 *   SUPABASE_ANON_KEY="YOUR_ANON_KEY" \
 *   USER_JWT="YOUR_LOGGED_IN_USER_JWT" \
 *   node idor-test.mjs
 *
 * Optional unauthenticated test:
 *   TEST_NO_AUTH=true node idor-test.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const USER_JWT = process.env.USER_JWT;
const TEST_NO_AUTH = process.env.TEST_NO_AUTH === "true";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

if (!USER_JWT && !TEST_NO_AUTH) {
  console.error("Missing USER_JWT. Or run with TEST_NO_AUTH=true");
  process.exit(1);
}

const actors = [
  { actor_id: "8ec482ce-fda0-48b6-a06d-0efd260d8469", kind: "user", profile_id: "02309246-b100-431b-9bd4-571e78e0a46b", vport_id: null },
  { actor_id: "547a6e90-51d7-486b-80c0-ba74b352b27b", kind: "vport", profile_id: null, vport_id: "bbcb511f-9924-45de-a71a-8b15b57c8cec" },
  { actor_id: "53506890-b2bd-4004-8e4c-99583711dfcc", kind: "user", profile_id: "ad8feef5-8d5a-4677-8734-f910bc2c0f50", vport_id: null },
  { actor_id: "766484aa-5043-4a1f-96da-b44104f44613", kind: "vport", profile_id: null, vport_id: "0b68fad3-dbae-4fe8-ae7f-4966e66bd6e5" },
  { actor_id: "1696f0f3-8480-4cf7-9a21-b81cb6f17e0f", kind: "vport", profile_id: null, vport_id: "f33d3add-b01a-4d95-be6d-9be81964bd8d" },
  { actor_id: "b6c09027-0720-40b4-9a92-b39d8ba26aeb", kind: "vport", profile_id: null, vport_id: "819c9456-b3b2-4283-b955-100c4a2a9ed9" },
  { actor_id: "57f7812a-2d54-4ff2-b198-03a9e83b17bc", kind: "vport", profile_id: null, vport_id: "858e6824-4d5b-47af-b8c2-a667be92db4c" },
  { actor_id: "6a5b7f9d-14a9-4fbc-b9a5-908b44220158", kind: "vport", profile_id: null, vport_id: "2d73e1f2-d716-49e4-9017-ee25fea9abcd" },
  { actor_id: "b80ebdc4-68f6-49e8-b64c-bfe3f78b6d30", kind: "user", profile_id: "e1820eac-89c7-473d-bb1c-a855a31e6ef3", vport_id: null },
  { actor_id: "9a0bcb90-dc36-4eed-bfad-03f3f27e9a9c", kind: "user", profile_id: "f75c9065-1596-4e7b-ba57-4b8bd9b03923", vport_id: null },
  { actor_id: "5fdff6de-0c48-465c-9050-9047f65f919f", kind: "vport", profile_id: null, vport_id: "5fcc63bd-2cc1-4401-accc-a123c1f02b2a" },
  { actor_id: "1bbac35e-b565-4106-91c0-7376790c87ae", kind: "user", profile_id: "15f5c5c5-d5e5-44a1-ba3a-469a86e1cfea", vport_id: null },
];

function headers(schema = "public", withAuth = true) {
  const h = {
    apikey: SUPABASE_ANON_KEY,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (schema !== "public") {
    h["Accept-Profile"] = schema;
    h["Content-Profile"] = schema;
  }

  if (withAuth && USER_JWT) {
    h.Authorization = `Bearer ${USER_JWT}`;
  }

  return h;
}

async function requestTest({ label, schema, path, withAuth }) {
  const url = `${SUPABASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: headers(schema, withAuth),
    });

    const text = await res.text();

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    const rowCount = Array.isArray(parsed) ? parsed.length : null;

    let verdict = "UNKNOWN";

    if (res.status === 401 || res.status === 403) {
      verdict = "SECURE_BLOCKED";
    } else if (res.status >= 400) {
      verdict = "ERROR";
    } else if (Array.isArray(parsed) && parsed.length === 0) {
      verdict = "SECURE_EMPTY";
    } else if (Array.isArray(parsed) && parsed.length > 0) {
      verdict = "DATA_RETURNED_REVIEW";
    } else {
      verdict = "NON_ARRAY_RESPONSE_REVIEW";
    }

    return {
      label,
      schema,
      path,
      auth: withAuth ? "with_auth" : "no_auth",
      status: res.status,
      rowCount,
      verdict,
      sample: Array.isArray(parsed) ? parsed.slice(0, 1) : parsed,
    };
  } catch (err) {
    return {
      label,
      schema,
      path,
      auth: withAuth ? "with_auth" : "no_auth",
      status: "FETCH_ERROR",
      rowCount: null,
      verdict: "FETCH_ERROR",
      sample: String(err?.message || err),
    };
  }
}

function buildTests(withAuth) {
  const tests = [];

  for (const actor of actors) {
    tests.push({
      label: `vport.profiles by actor_id ${actor.kind}`,
      schema: "vport",
      path: `/rest/v1/profiles?select=id,actor_id,name,slug,avatar_url,banner_url,is_active,directory_visible,directory_status&actor_id=eq.${actor.actor_id}`,
      withAuth,
    });

    tests.push({
      label: `vport.public_traze_profiles_v by actor_id ${actor.kind}`,
      schema: "vport",
      path: `/rest/v1/public_traze_profiles_v?select=actor_id,name,slug,avatar_url&actor_id=eq.${actor.actor_id}`,
      withAuth,
    });

    tests.push({
      label: `vc.actors by id ${actor.kind}`,
      schema: "vc",
      path: `/rest/v1/actors?select=id,kind,profile_id,vport_id&id=eq.${actor.actor_id}`,
      withAuth,
    });

    if (actor.profile_id) {
      tests.push({
        label: `public.profiles by profile_id ${actor.kind}`,
        schema: "public",
        path: `/rest/v1/profiles?select=id,username,display_name,photo_url,banner_url,photo_media_asset_id,banner_media_asset_id&id=eq.${actor.profile_id}`,
        withAuth,
      });
    }

    if (actor.vport_id) {
      tests.push({
        label: `vport.profiles by vport_id ${actor.kind}`,
        schema: "vport",
        path: `/rest/v1/profiles?select=id,actor_id,name,slug,avatar_url,banner_url,is_active,directory_visible,directory_status&id=eq.${actor.vport_id}`,
        withAuth,
      });
    }
  }

  // Broad table exposure tests.
  tests.push({
    label: "public.profiles broad select",
    schema: "public",
    path: `/rest/v1/profiles?select=id,username,display_name,photo_url,banner_url&limit=10`,
    withAuth,
  });

  tests.push({
    label: "vport.profiles broad select",
    schema: "vport",
    path: `/rest/v1/profiles?select=id,actor_id,name,slug,avatar_url,banner_url,is_active,directory_visible,directory_status&limit=10`,
    withAuth,
  });

  tests.push({
    label: "vport.public_traze_profiles_v broad select",
    schema: "vport",
    path: `/rest/v1/public_traze_profiles_v?select=actor_id,name,slug,avatar_url&limit=10`,
    withAuth,
  });

  return tests;
}

async function main() {
  const allTests = [];

  if (USER_JWT) allTests.push(...buildTests(true));
  if (TEST_NO_AUTH) allTests.push(...buildTests(false));

  const results = [];

  for (const test of allTests) {
    const result = await requestTest(test);
    results.push(result);

    const icon =
      result.verdict === "DATA_RETURNED_REVIEW"
        ? "⚠️"
        : result.verdict.startsWith("SECURE")
          ? "✅"
          : "❔";

    console.log(
      `${icon} [${result.auth}] ${result.status} ${result.verdict} rows=${result.rowCount} :: ${result.label}`
    );
  }

  const risky = results.filter((r) => r.verdict === "DATA_RETURNED_REVIEW");

  console.log("\n=== SUMMARY ===");
  console.log(`Total tests: ${results.length}`);
  console.log(`Data returned / review: ${risky.length}`);

  console.log("\n=== DATA RETURNED REVIEW ITEMS ===");
  for (const r of risky) {
    console.log(`\n[${r.auth}] ${r.status} ${r.label}`);
    console.log(r.path);
    console.log(JSON.stringify(r.sample, null, 2));
  }

  console.log("\nNOTE:");
  console.log("- DATA_RETURNED_REVIEW is not always a bug.");
  console.log("- Public views like vport.public_traze_profiles_v are expected to return listed public VPORTs.");
  console.log("- Owner-only tables like vport.profiles should not return other owners' private rows.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});