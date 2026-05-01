import { ensureWandersGuestSessionUser } from "@/features/wanders/services/wandersAuthSession";

/**
 * Ensure we have a Supabase Auth user.
 * In guest mode, we attempt to sign in anonymously if no session exists.
 *
 * @returns {Promise<{ id: string }>} minimal user shape
 */
export async function ensureGuestUser() {
  const user = await ensureWandersGuestSessionUser();
  return { id: user.id };
}
