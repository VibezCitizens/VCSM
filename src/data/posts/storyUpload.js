// src/data/stories/storyUpload.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Insert a story row after you have mediaUrl (image or video).
 * If vportId is provided, inserts into vport_stories; else into stories.
 */
export async function createStory({
  userId,          // REQUIRED for user story
  vportId = null,  // If set => vport story
  mediaUrl,        // REQUIRED
  mediaType,       // 'image' | 'video'
  caption = '',
}) {
  if (!mediaUrl) throw new Error('createStory: mediaUrl is required');
  if (!mediaType) throw new Error('createStory: mediaType is required');

  if (vportId) {
    const { error } = await supabase
      .from('vport_stories')
      .insert([{ vport_id: vportId, created_by: userId, media_url: mediaUrl, media_type: mediaType, caption }]);
    if (error) throw error;
    return true;
  }

  if (!userId) throw new Error('createStory: userId is required for user story');
  const { error } = await supabase
    .from('stories')
    .insert([{ user_id: userId, media_url: mediaUrl, media_type: mediaType, caption }]);
  if (error) throw error;
  return true;
}
