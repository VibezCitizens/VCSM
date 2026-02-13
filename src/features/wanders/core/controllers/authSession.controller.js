// src/features/wanders/core/controllers/authSession.controller.js
// ============================================================================
// WANDERS CONTROLLER — AUTH SESSION
// Owns meaning: "is the user authenticated right now?"
// Imports supabase (allowed) and returns domain-level booleans.
// ============================================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * @returns {Promise<{ isAuthed: boolean, userId: string|null }>}
 */
export async function getWandersAuthStatus() {
  try {
    const res = await supabase.auth.getSession();
    const session = res?.data?.session || null;

    const userId = session?.user?.id || null;
    const isAuthed = !!session?.access_token && !!userId;

    return { isAuthed, userId };
  } catch {
    return { isAuthed: false, userId: null };
  }
}
