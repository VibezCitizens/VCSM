/**
 * Extracts a YouTube video ID from common URL formats.
 *
 * Supported:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *   - With or without extra params, timestamps, playlists
 *
 * Returns the video ID string or null if the URL is not a YouTube link.
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;

  try {
    const u = new URL(url);

    // youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    // youtube.com variants
    if (u.hostname.includes("youtube.com")) {
      // /embed/VIDEO_ID
      const embedMatch = u.pathname.match(/^\/embed\/([\w-]{11})/);
      if (embedMatch) return embedMatch[1];

      // /watch?v=VIDEO_ID
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the URL is a recognized YouTube link.
 */
export function isYouTubeUrl(url) {
  return extractYouTubeId(url) !== null;
}

/**
 * Builds a YouTube embed URL from a video ID.
 */
export function youtubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`;
}
