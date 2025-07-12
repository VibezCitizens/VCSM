export default function VideoFeed({ posts }) {
  // Filter for video posts (e.g., .mp4)
  const videoPosts = posts.filter(post => {
    const url = post.media_url || '';
    return url.endsWith('.mp4');
  });

  if (videoPosts.length === 0) {
    return <p className="text-center text-neutral-500">No videos found.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {videoPosts.map(post => (
        <div
          key={post.id}
          className="aspect-square relative overflow-hidden rounded bg-black"
        >
          <video
            src={post.media_url}
            className="object-cover w-full h-full"
            muted
            loop
            playsInline
            preload="metadata"
          />
          {post.text && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
              {post.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
