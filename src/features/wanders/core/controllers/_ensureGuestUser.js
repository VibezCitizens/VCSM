import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

/**
 * Ensure we have a Supabase Auth user.
 * In guest mode, we attempt to sign in anonymously if no session exists.
 *
 * @returns {Promise<{ id: string }>} minimal user shape
 */
export async function ensureGuestUser() {
  const supabase = getWandersSupabase();

  // 1) Fast path: session-based user (no error when missing)
  const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;

  const sessionUserId = sessionRes?.session?.user?.id;
  if (sessionUserId) return { id: sessionUserId };

  // 2) No session -> Anonymous sign-in (requires "Anonymous Sign-Ins" enabled)
  const { data: anonRes, error: anonErr } = await supabase.auth.signInAnonymously();
  if (anonErr) throw anonErr;

  const uid = anonRes?.user?.id;
  if (!uid) throw new Error("Guest sign-in failed: no user id returned.");

  return { id: uid };
}
