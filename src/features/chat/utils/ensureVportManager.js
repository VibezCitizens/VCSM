// src/features/chat/utils/ensureVportManager.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Returns:
 *  - true  => user is already a manager (or just got auto-promoted by backend RPC)
 *  - false => not a manager; a request either already exists or was just created
 */
export async function ensureVportManager(vportId) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid || !vportId) return false;

  // ✅ FIX: filter by manager_user_id (NOT user_id)
  const { data: mgr, error: mgrErr } = await supabase
    .from('vport_managers')
    .select(
      'vport_id, vports:vports!vport_managers_vport_id_fkey(id,name,avatar_url)'
    )
    .eq('vport_id', vportId)
    .eq('manager_user_id', uid)
    .maybeSingle();

  if (mgrErr) {
    console.error('[ensureVportManager] manager check error:', mgrErr);
    // if this line 400s again, you still have user_id somewhere in your code
  }
  if (mgr) return true; // already a manager

  // Try a SECURITY DEFINER RPC if you have one that auto-promotes owners.
  // If you don't have it, this will just fall through to the request insert.
  const { data: ensured, error: rpcErr } = await supabase
    .rpc('ensure_vport_manager', { p_vport_id: vportId });
  if (!rpcErr && ensured === true) return true;

  // If no RPC or not auto-approved, ensure a pending request exists.
  const { data: existing } = await supabase
    .from('vport_manager_requests')
    .select('id,status')
    .eq('vport_id', vportId)
    .eq('requester_user_id', uid)
    .eq('status', 'pending')
    .maybeSingle();

  if (!existing) {
    const { error: insErr } = await supabase
      .from('vport_manager_requests')
      .insert({ vport_id: vportId, requester_user_id: uid });
    if (insErr) console.error('[ensureVportManager] create request error:', insErr);
  }

  return false;
}

