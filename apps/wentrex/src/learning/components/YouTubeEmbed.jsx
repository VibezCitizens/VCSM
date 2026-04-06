import { extractYouTubeId, youtubeEmbedUrl } from "@/learning/lib/youtubeUtils";

const MUTED = "#64748b";

/**
 * Renders a responsive YouTube embed player for a given URL.
 * Falls back to null if the URL is not a valid YouTube link.
 *
 * Props:
 *   url    – any URL string; only renders if it's a YouTube link
 *   title  – optional accessible title for the iframe
 */
export default function YouTubeEmbed({ url, title }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{
        position: "relative",
        width: "100%",
        paddingBottom: "56.25%", // 16:9 aspect ratio
        borderRadius: 10,
        overflow: "hidden",
        background: "#000",
      }}>
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title={title || "YouTube video"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          allow="fullscreen"
          allowFullScreen
        />
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 12, color: MUTED, textDecoration: "none" }}>
        Open on YouTube ↗
      </a>
    </div>
  );
}
