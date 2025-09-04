// src/features/chat/utils/getMyManagedVports.js
// Manager system removed. This compatibility helper now returns VPORTs
// the current user OWNS (vports.created_by = auth.uid()) and keeps the
// same shape as before so callers don’t break.

import { supabase } from '@/lib/supabaseClient';

/**
 * Returns:
 *   { data: [{ vport_id, vport: { id, name, avatar_url } }], error }
 */
export async function getMyManagedVports() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { data: [], error: null };

  const { data, error } = await supabase
    .from('vports')
    .select('id, name, avatar_url')
    .eq('created_by', uid);

  if (error) return { data: [], error };

  const rows = (data || []).map((v) => ({
    vport_id: v.id,
    vport: { id: v.id, name: v.name, avatar_url: v.avatar_url },
  }));

  return { data: rows, error: null };
}

export default getMyManagedVports;
