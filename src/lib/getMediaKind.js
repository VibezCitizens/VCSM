// src/lib/getMediaKind.js
export default function getMediaKind(media_type) {
  if (!media_type) return null;
  const t = String(media_type).toLowerCase().trim();

  if (t === 'image' || t === 'photo' || t === 'picture') return 'image';
  if (t.startsWith('image/')) return 'image';

  if (t === 'video') return 'video';
  if (t.startsWith('video/')) return 'video';

  return null;
}
