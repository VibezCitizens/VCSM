// src/features/wanders/core/controllers/authSession.controller.js
// ============================================================================
// WANDERS CONTROLLER — AUTH SESSION
// Owns meaning: "is the user authenticated right now?"
// Reads auth session state and returns domain-level booleans.
// ============================================================================
import { readWandersSessionUser } from "@/features/wanders/services/wandersAuthSession";

/**
 * @returns {Promise<{ isAuthed: boolean, userId: string|null }>}
 */
export async function getWandersAuthStatus() {
  try {
    const user = await readWandersSessionUser();
    const userId = user?.id || null;
    const isAuthed = !!userId;

    return { isAuthed, userId };
  } catch {
    return { isAuthed: false, userId: null };
  }
}
