// src/lib/supabaseClient.debug.js
import { createClient } from '@supabase/supabase-js';

/**
 * Small helpers
 */
const toObj = (headers) => {
  try { return Object.fromEntries([...headers.entries()]); } catch { return {}; }
};
const REDACT = (v) =>
  typeof v === 'string'
    ? v.replace(/(Bearer\s+)[\w\-.]+/i, '$1[REDACTED]')
    : v;

/**
 * Simple timing helper for your own measurements.
 * Usage:
 *   const t = timeit('openChatWithUser');
 *   ...await something...
 *   t.end(); // logs elapsed ms
 */
export function timeit(label = 'timer') {
  const t0 = performance?.now?.() ?? Date.now();
  return {
    end(extra = {}) {
      const t1 = performance?.now?.() ?? Date.now();
      const ms = Math.round(t1 - t0);
      // collapse to keep console tidy
      console.groupCollapsed(`[TIME] ${label}: ${ms} ms`);
      if (extra && typeof extra === 'object') console.log(extra);
      console.groupEnd();
      return ms;
    },
  };
}

/**
 * Debug client factory: wraps fetch to log request/response (sanitized).
 * - Does NOT change your app logic — only logs what’s sent/received.
 * - Works for both REST and RPC calls.
 */
export function createDebugClient(SUPABASE_URL, SUPABASE_ANON_KEY, options = {}) {
  const debugFetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    const method = init?.method || (typeof input !== 'string' ? input?.method : 'GET');

    // Gather headers from either init or Request object
    let hdrs = {};
    if (init?.headers) hdrs = init.headers;
    else if (typeof input !== 'string' && input?.headers) hdrs = toObj(input.headers);

    // Redact auth for logs
    const redactedHeaders = Object.fromEntries(
      Object.entries(hdrs).map(([k, v]) => [k, REDACT(String(v))])
    );

    // Try to preview JSON body
    let body = init?.body;
    if (!body && typeof input !== 'string') {
      try {
        const clone = input.clone();
        body = await clone.text();
      } catch { /* ignore */ }
    }
    if (body && typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* leave as string */ }
    }

    // BEFORE
    console.groupCollapsed(`[SUPABASE] ${method} ${url}`);
    console.log('> headers:', redactedHeaders);
    if (body !== undefined) console.log('> body:', body);
    console.groupEnd();

    // FETCH
    const res = await fetch(input, init);

    // AFTER
    const clone = res.clone();
    let json = null;
    try { json = await clone.json(); } catch { /* may be empty or non-JSON */ }

    console.groupCollapsed(`[SUPABASE] ${res.status} ${method} ${url}`);
    console.log('< status:', res.status, res.statusText || '');
    console.log('< headers:', toObj(res.headers));
    if (json !== null) console.log('< json:', json);
    else console.log('< (non-JSON response body)');
    console.groupEnd();

    return res;
  };

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...options,
    global: { ...(options.global || {}), fetch: debugFetch },
  });
}

/**
 * One-shot auth/session/schema probe.
 * Call this right before a sensitive write to verify token + schema context.
 *
 * Example:
 *   await debugAuthProbe(vc, 'Message(user→user):pre');
 */
export async function debugAuthProbe(client, label = 'AuthProbe') {
  const [{ data: sessionData, error: sessionErr }, { data: userData, error: userErr }] =
    await Promise.all([client.auth.getSession(), client.auth.getUser()]);

  console.groupCollapsed(`[${label}] Auth Context`);
  console.log('user error:', userErr || null);
  console.log('session error:', sessionErr || null);
  console.log('user:', userData?.user || null);
  console.log('session.expires_at:', sessionData?.session?.expires_at || null);
  console.log('access_token present:', !!sessionData?.session?.access_token);
  console.log('schema (rest):', client?.rest?.schema ?? '(default)');
  console.groupEnd();

  return { sessionData, userData };
}

// Optional: expose helpers for quick manual debugging from the console
if (typeof window !== 'undefined') {
  window.__sbDebug = { debugAuthProbe, timeit };
}
