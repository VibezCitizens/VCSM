// src/features/post/UploadScreen.jsx
import React from 'react';
import UploadScreenModern from './uploadscreen/UploadScreenModern';
import supabase from '@/lib/supabaseClient';

// ✅ actor helpers
import { getActiveVportId } from '@/lib/actors/actor';
import { resolveActorId } from '@/lib/actors/actors';

export default function UploadScreen() {
  return (
    <UploadScreenModern
      onCreatePost={async (payload) => {
        // 1) auth → userId
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr || !auth?.user) throw new Error('Not authenticated');
        const userId = auth.user.id;

        // 2) resolve current identity → actor_id (user or vport)
        const activeVportId = getActiveVportId(); // null in user mode
        const actorId = await resolveActorId({ userId, activeVportId });
        if (!actorId) throw new Error('Could not resolve actor');

        // 3) build row for vc.posts (actor_id now required; keep user_id for RLS/joins)
        const row = {
          user_id: userId,                           // owner (profiles.id)
          actor_id: actorId,                         // who is posting (user/vport actor)
          text: payload.caption || '',
          title: null,
          media_url: payload.media_url || '',
          media_type: payload.media_type || 'text',  // 'text' | 'image' | 'video'
          post_type: payload.mode || 'post',
          // created_at defaults in DB
        };

        // 4) insert
        const { error: insErr } = await supabase.schema('vc').from('posts').insert(row);
        if (insErr) throw insErr;
      }}
    />
  );
}
