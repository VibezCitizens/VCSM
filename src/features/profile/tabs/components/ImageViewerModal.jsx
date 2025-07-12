import { X, Share2 } from 'lucide-react';
import { useEffect } from 'react';

export default function ImageViewerModal({
  imagePosts,
  onClose,
  toggleReaction,
  sendRose,
  handleShare,
  openComments,
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close background click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Scrollable vertical carousel */}
      <div
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory z-10 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {imagePosts.map((post, index) => (
          <div
            key={post.id}
            className="snap-start h-full w-full flex flex-col items-center justify-center relative"
          >
            <img
              src={post.media_url}
              alt="Post"
              className="object-contain max-h-full max-w-full"
            />

            {/* Reaction panel per image */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-5 shadow-lg border border-white/10 flex flex-col items-center gap-4 text-white text-xl w-14">
              {/* Like */}
              <button onClick={() => toggleReaction(post.id, 'like')} className="flex flex-col items-center justify-center gap-1">
                <div className="text-2xl">👍</div>
                <span className="text-xs text-white">{post.likeCount || 0}</span>
              </button>

              {/* Dislike */}
              <button onClick={() => toggleReaction(post.id, 'dislike')} className="flex flex-col items-center justify-center gap-1">
                <div className="text-2xl">👎</div>
                <span className="text-xs text-white">{post.dislikeCount || 0}</span>
              </button>

              {/* Rose */}
              <button onClick={() => sendRose(post.id)} className="flex flex-col items-center justify-center gap-1">
                <div className="text-2xl">🌹</div>
                <span className="text-xs text-white">{post.roseCount || 0}</span>
              </button>

              {/* Comments */}
              <button onClick={() => openComments(post.id)} className="flex flex-col items-center justify-center gap-1">
                <div className="text-2xl">💬</div>
                <span className="text-xs text-white">{post.commentCount || 0}</span>
              </button>

              {/* Share */}
              <button
                onClick={() => handleShare(post)}
                title="Share"
                className="flex flex-col items-center justify-center gap-1"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Close button on top */}
      <button
        className="absolute top-4 right-4 bg-black/70 text-white rounded-full flex items-center justify-center w-9 h-9 z-20"
        onClick={onClose}
      >
        <X size={20} />
      </button>
    </div>
  );
}