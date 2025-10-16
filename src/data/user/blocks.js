// src/data/blocks.js
import { vc } from '@/lib/vcClient';
import { supabase } from '@/lib/supabaseClient';

/**
 * DAL for vc.user_blocks (compat for any old code that queried public.user_blocks).
 * All operations occur in the 'vc' schema via vcClient.
 */
export const blocks = {
  /**
   * Block a profile (blockedId is public.profiles.id UUID)
   * Returns the created row.
   */
  async block(blockedId, reason = null) {
    if (!blockedId) throw new Error('blocks.block: blockedId required');

    const { data: auth } = await supabase.auth.getUser();
    const blockerId = auth?.user?.id;
    if (!blockerId) throw new Error('blocks.block: auth required');

    const { data, error } = await vc
      .from('user_blocks')
      .insert([{ blocker_id: blockerId, blocked_id: blockedId, reason }])
      .select('id, blocker_id, blocked_id, reason, created_at')
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  /**
   * Unblock a profile (idempotent: ignores 0-row delete).
   */
  async unblock(blockedId) {
    if (!blockedId) throw new Error('blocks.unblock: blockedId required');

    const { data: auth } = await supabase.auth.getUser();
    const blockerId = auth?.user?.id;
    if (!blockerId) throw new Error('blocks.unblock: auth required');

    const { error } = await vc
      .from('user_blocks')
      .delete()
      .match({ blocker_id: blockerId, blocked_id: blockedId });

    if (error) throw error;
    return true;
  },

  /**
   * Check if current user has blocked target.
   */
  async isBlocked(blockedId) {
    if (!blockedId) return false;

    const { data: auth } = await supabase.auth.getUser();
    const blockerId = auth?.user?.id;
    if (!blockerId) return false;

    const { data, error } = await vc
      .from('user_blocks')
      .select('id')
      .match({ blocker_id: blockerId, blocked_id: blockedId })
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  /**
   * List profiles I have blocked (IDs only by default).
   */
  async listMyBlocks({ limit = 100, withReasons = false } = {}) {
    const { data: auth } = await supabase.auth.getUser();
    const blockerId = auth?.user?.id;
    if (!blockerId) return [];

    const cols = withReasons ? 'blocked_id, reason, created_at' : 'blocked_id';

    const { data, error } = await vc
      .from('user_blocks')
      .select(cols)
      .eq('blocker_id', blockerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },
};

export default blocks;
