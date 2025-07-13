import { X, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ImageViewerModal({
  imagePosts,
  activeIndex,
  setActiveIndex,
  onClose,
  toggleReaction,
  sendRose,
  handleShare,
  openComments,
}) {
  const [localPosts, setLocalPosts] = useState(imagePosts);
  const containerRef = useRef(null);
  const itemRefs = useRef([]); // 🔥 Track each post's div

  useEffect(() => {
    setLocalPosts(imagePosts);
  }, [imagePosts]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    // 🔥 Scroll to the clicked image when modal opens
    if (activeIndex != null && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex].scrollIntoView({ behavior: 'instant' });
    }
  }, [activeIndex]);

  const handleUserReaction = async (postId, type) => {
    await toggleReaction(postId, type);
  };

  const handleUserRose = async (postId) => {
    await sendRose(postId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory z-10 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {localPosts.map((post, index) => (
          <div
            key={post.id}
            ref={(el) => (itemRefs.current[index] = el)} // 🔥 Assign each ref
            className="snap-start h-full w-full flex flex-col items-center justify-center relative"
          >
            <img
              src={post.media_url}
              alt="Post"
              className="object-contain max-h-full max-w-full"
            />

            {/* 🔥 Reaction buttons */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-5 shadow-lg border border-white/10 flex flex-col items-center gap-4 text-white text-xl w-14">
              <button
                onClick={() => handleUserReaction(post.id, 'like')}
                className="flex flex-col items-center gap-1"
              >
                <div className={`text-2xl ${post.userHasReacted === 'like' ? 'text-blue-400' : ''}`}>👍</div>
                <span className="text-xs">{post.likeCount || 0}</span>
              </button>

              <button
                onClick={() => handleUserReaction(post.id, 'dislike')}
                className="flex flex-col items-center gap-1"
              >
                <div className={`text-2xl ${post.userHasReacted === 'dislike' ? 'text-red-400' : ''}`}>👎</div>
                <span className="text-xs">{post.dislikeCount || 0}</span>
              </button>

              <button
                onClick={() => handleUserRose(post.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="text-2xl">🌹</div>
                <span className="text-xs">{post.roseCount || 0}</span>
              </button>

              <button
                onClick={() => openComments(post.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="text-2xl">💬</div>
                <span className="text-xs">{post.commentCount || 0}</span>
              </button>

              <button
                onClick={() => handleShare(post)}
                title="Share"
                className="flex flex-col items-center justify-center gap-1"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 Close button */}
      <button
        className="absolute top-4 right-4 bg-black/70 text-white rounded-full flex items-center justify-center w-9 h-9 z-20 hover:bg-black/90"
        onClick={onClose}
      >
        <X size={20} />
      </button>
    </div>
  );
}
