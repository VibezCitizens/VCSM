// src/data/user/post/comments.js
// Actor-based comments with author enrichment (profiles via actors), vport-aware.
// Filters out comments from users I blocked or who blocked me (both directions).

import { supabase } from '@/lib/supabaseClient';
import { getCurrentActorId } from '@/lib/actors/actors';

/* -------------------- tiny helpers: retry + net-safe -------------------- */

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, { tries = 2, delay = 250 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('networkerror') || msg.includes('failed to fetch') || msg.includes('fetch')) {
        lastErr = e;
        if (i < tries - 1) await sleep(delay * (i + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

/** Resolve current profile id (equals auth.uid() in your setup). */
async function getCurrentProfileId() {
  try {
    const { data, error } = await withRetry(() => supabase.auth.getUser());
    if (error) throw error;
    return data?.user?.id ?? null;
  } catch (e) {
    console.error('[comments.getCurrentProfileId] error:', e);
    return null;
  }
}

/** Load block relationships involving me (both directions). */
async function getBlockSets(meId) {
  if (!meId) return { iBlocked: new Set(), blockedMe: new Set() };

  try {
    const [myBlocks, blockedBy] = await withRetry(async () => {
      const [{ data: d1, error: e1 }, { data: d2, error: e2 }] = await Promise.all([
        supabase.schema('vc').from('user_blocks').select('blocked_id').eq('blocker_actor_id', meId),
        supabase.schema('vc').from('user_blocks').select('blocker_id').eq('blocked_actor_id', meId),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return [d1 || [], d2 || []];
    });

    return {
      iBlocked: new Set(myBlocks.map(r => r.blocked_id)),
      blockedMe: new Set(blockedBy.map(r => r.blocker_id)),
    };
  } catch (err) {
    console.error('[comments.getBlockSets] error:', err);
    return { iBlocked: new Set(), blockedMe: new Set() };
  }
}

// vport-aware enrichment
async function attachAuthors(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const actorIds = [...new Set(rows.map(r => r.actor_id).filter(Boolean))];
  if (!actorIds.length) {
    return rows.map(r => ({ ...r, profiles: null, author: null, as_vport: false, actor_vport_id: null, vport: null }));
  }

  // 1) fetch actors
  const actors = await withRetry(async () => {
    const { data, error } = await supabase
      .schema('vc')
      .from('actors')
      .select('id, profile_id, vport_id, kind')
      .in('id', actorIds);
    if (error) throw error;
    return data || [];
  });

  const actorRows = actors || [];
  const byActor = new Map(actorRows.map(a => [a.id, a]));
  const profileIds = [...new Set(actorRows.map(a => a?.profile_id).filter(Boolean))];
  const vportIds   = [...new Set(actorRows.map(a => a?.vport_id).filter(Boolean))];

  // 2) load profiles
  const profs = profileIds.length
    ? await withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, photo_url')
          .in('id', profileIds);
        if (error) throw error;
        return data || [];
      })
    : [];
  const byProfile = new Map(profs.map(p => [p.id, p]));

  // 3) load vports
  const vps = vportIds.length
    ? await withRetry(async () => {
        const { data, error } = await supabase
          .schema('vc')
          .from('vports')
          .select('id, name, avatar_url, slug, is_active')
          .in('id', vportIds);
        if (error) throw error;
        return data || [];
      })
    : [];
  const byVport = new Map(vps.map(v => [v.id, v]));

  // 4) build enriched rows
  return rows.map(r => {
    const a = byActor.get(r.actor_id);

    if (a?.vport_id) {
      const v = byVport.get(a.vport_id) || null;
      return {
        ...r,
        profiles: null,
        author: null,
        as_vport: true,
        actor_vport_id: a.vport_id,
        vport: v
          ? { id: v.id, name: v.name || 'VPORT', avatar_url: v.avatar_url || '/avatar.jpg', slug: v.slug || null }
          : { id: a.vport_id, name: 'VPORT', avatar_url: '/avatar.jpg', slug: null },
      };
    }

    const pid = r.user_id || a?.profile_id || null;
    const p = pid ? byProfile.get(pid) : null;
    const profiles = p
      ? {
          id: p.id,
          username: p.username || '',
          display_name: p.display_name || '',
          photo_url: p.photo_url || '',
          avatar_url: p.photo_url || '',
          name: p.display_name || p.username || '',
        }
      : null;

    const author = profiles
      ? {
          id: profiles.id,
          username: profiles.username,
          display_name: profiles.display_name,
          photo_url: profiles.photo_url,
          avatar_url: profiles.avatar_url,
          name: profiles.name,
        }
      : null;

    return { ...r, profiles, author, as_vport: false, actor_vport_id: null, vport: null };
  });
}

/** Filter rows by block status */
function filterByBlocks(rows, iBlocked, blockedMe) {
  if (!rows?.length) return [];
  return rows.filter(r => {
    const ownerId =
      r.user_id || r.profiles?.id || r.author?.id || r.vport?.id || null;
    if (!ownerId) return false;
    if (iBlocked.has(ownerId)) return false;
    if (blockedMe.has(ownerId)) return false;
    return true;
  });
}

/* ------------------------- API ------------------------- */

export async function listTopLevel({ postId }) {
  if (!postId) return [];
  try {
    const meId = await getCurrentProfileId();
    const { iBlocked, blockedMe } = await getBlockSets(meId);

    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .schema('vc')
        .from('post_comments')
        .select('id, post_id, actor_id, user_id, content, parent_id, created_at, deleted_at')
        .eq('post_id', postId)
        .is('parent_id', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    });

    const enriched = await attachAuthors(data);
    return filterByBlocks(enriched, iBlocked, blockedMe);
  } catch (e) {
    console.error('[comments.listTopLevel] error:', e);
    return [];
  }
}

export async function listReplies(arg) {
  const parentId = typeof arg === 'string' ? arg : arg?.parentId;
  if (!parentId) return [];
  try {
    const meId = await getCurrentProfileId();
    const { iBlocked, blockedMe } = await getBlockSets(meId);

    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .schema('vc')
        .from('post_comments')
        .select('id, post_id, actor_id, user_id, content, parent_id, created_at, deleted_at')
        .eq('parent_id', parentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    });

    const enriched = await attachAuthors(data);
    return filterByBlocks(enriched, iBlocked, blockedMe);
  } catch (e) {
    console.error('[comments.listReplies] error:', e);
    return [];
  }
}

export async function create({
  postId,
  content,
  userId,
  parentId = null,
  actingAsVport = false,
  vportId = null,
}) {
  const text = (content || '').trim();
  if (!postId || !text) throw new Error('comments.create: postId and content are required');

  const actorId = await getCurrentActorId({
    userId,
    activeVportId: actingAsVport ? vportId : null,
  });
  if (!actorId) throw new Error('comments.create: no actor for current identity');

  const payload = {
    post_id: postId,
    actor_id: actorId,
    user_id: userId,        // ✅ FIX: include user_id so RLS passes
    content: text,
    parent_id: parentId || null,
  };

  const data = await withRetry(async () => {
    const { data, error } = await supabase
      .schema('vc')
      .from('post_comments')
      .insert(payload)
      .select('id, post_id, actor_id, user_id, content, parent_id, created_at')
      .maybeSingle();
    if (error) throw error;
    return data;
  });

  const [row] = await attachAuthors([data]);
  return row || data;
}

export async function remove({ id }) {
  if (!id) return;
  await withRetry(async () => {
    const { error } = await supabase
      .schema('vc')
      .from('post_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  });
}

export async function update({ id, content }) {
  const text = (content || '').trim();
  if (!id || !text) return;
  await withRetry(async () => {
    const { error } = await supabase
      .schema('vc')
      .from('post_comments')
      .update({ content: text })
      .eq('id', id);
    if (error) throw error;
  });
}

const api = { listTopLevel, listReplies, create, remove, update };
export default api;
