// src/features/chat/hooks/useProfileUploader.js
import imageCompression from 'browser-image-compression';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { supabase } from '@/lib/supabaseClient';

/**
 * Uploads a profile picture for the current user.
 * 1) Compress on client
 * 2) Upload to Cloudflare (Worker)
 * 3) Persist the *string URL* to public.profiles.photo_url
 *
 * @param {File} file - Raw file from <input>
 * @returns {Promise<string>} - Final public URL
 */
export async function uploadProfilePicture(file) {
  if (!file) throw new Error('No file provided.');

  // 1) Compress
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.7,
    maxWidthOrHeight: 600,
    useWebWorker: true,
  });

  // 2) Upload
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error('Not authenticated.');

  // Use a cache-busting name so avatars update immediately
  const key = `profile-pictures/${userId}-${Date.now()}.jpg`;

  const { url, error } = await uploadToCloudflare(compressed, key);
  if (error || !url) throw new Error(error || 'Upload failed');

  // 3) Persist *only the string URL*
  const { error: upErr } = await supabase
    .from('profiles')
    .update({ photo_url: url })
    .eq('id', userId);

  if (upErr) throw upErr;

  return url; // string
} 