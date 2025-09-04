// src/features/posts/utils/formatPostTime.js
export function formatPostTime(iso) {
  const now = new Date();
  const postDate = new Date(iso);
  const diff = (now - postDate) / 1000;

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return postDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== postDate.getFullYear() ? 'numeric' : undefined,
  });
}

export default formatPostTime;
