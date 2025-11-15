// src/data/vport/vprofile/vport.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Create a Vport. Preferred path: owner-aware RPC.
 * Fallback: legacy RPC (now hardened to set owner via auth.uid()).
 *
 * @param {Object} args
 * @param {string} args.name
 * @param {string|null} args.slug
 * @param {string|null} args.avatarUrl
 * @param {string|null} args.bio
 * @param {string|null} [args.ownerUserId] - optional explicit owner (usually equals user.id)
 * @returns {Promise<{ vport_id: string, actor_id: string }>}
 */
export async function createVport({ name, slug, avatarUrl, bio, ownerUserId = null }) {
  // Try new, owner-aware RPC first
  const { data: d1, error: e1 } = await supabase.rpc('vc.create_vport_with_owner', {
    p_owner_user_id: ownerUserId,                // may be null; server falls back to auth.uid()
    p_name: name,
    p_slug: slug ?? null,
    p_avatar_url: avatarUrl ?? null,
    p_bio: bio ?? null,
  });

  if (!e1 && d1 && d1.length > 0) {
    const row = d1[0];
    return { vport_id: row.vport_id, actor_id: row.actor_id };
  }

  // Fallback to legacy RPC signature
  const { data: d2, error: e2 } = await supabase.rpc('vc.create_vport', {
    p_name: name,
    p_slug: slug ?? null,
    p_avatar_url: avatarUrl ?? null,
    p_bio: bio ?? null,
  });

  if (e2) {
    // Surface the more specific error if the first one was informative
    throw e1 ?? e2;
  }

  const row = Array.isArray(d2) ? d2[0] : d2;
  return { vport_id: row.vport_id, actor_id: row.actor_id };
}
