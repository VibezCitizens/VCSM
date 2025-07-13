// src/lib/postReactions.js
import { supabase } from '@/lib/supabaseClient';

export async function toggleReaction(postId, userId, type) {
  if (!userId) return;

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('type', type)
    .maybeSingle();

  if (existing) {
    // If a reaction of the same type exists, delete it (toggle off)
    await supabase.from('post_reactions').delete().eq('id', existing.id);
  } else {
    // If no reaction of the same type exists, proceed to insert/update

    // If the new reaction is 'like' or 'dislike', delete any existing 'like' or 'dislike' from the user for this post
    if (type === 'like' || type === 'dislike') {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .in('type', ['like', 'dislike']); // Deletes either 'like' or 'dislike' if present
    }

    // Insert the new reaction
    await supabase.from('post_reactions').insert({
      post_id: postId,
      user_id: userId,
      type,
    });
  }
}

export async function sendRose(postId, userId) {
  if (!userId) return;
  // Simply insert a new rose reaction. Roses are not mutually exclusive with likes/dislikes
  await supabase.from('post_reactions').insert({
    post_id: postId,
    user_id: userId,
    type: 'rose',
  });
}