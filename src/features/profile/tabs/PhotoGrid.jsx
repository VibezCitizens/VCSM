import { useState } from 'react';
import ImageViewerModal from './components/ImageViewerModal';

export default function PhotoGrid({
  posts,
  toggleReaction,
  sendRose,
  handleShare,
}) {
  const [showViewer, setShowViewer] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const imagePosts = posts.filter(
    (p) => p.media_type === 'image' && p.media_url
  );

  if (imagePosts.length === 0) {
    return (
      <div className="text-center text-neutral-400 py-10">
        No images yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 p-2">
        {imagePosts.map((post, index) => (
          <img
            key={post.id}
            src={post.media_url}
            className="w-full aspect-square object-cover cursor-pointer"
            onClick={() => {
              setActiveIndex(index);
              setShowViewer(true);
            }}
          />
        ))}
      </div>

      {showViewer && (
        <ImageViewerModal
          imagePosts={imagePosts}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onClose={() => setShowViewer(false)}
          toggleReaction={toggleReaction}
          sendRose={sendRose}
          handleShare={handleShare}
          openComments={(postId) => {
            setSelectedPostId(postId);
            setShowComments(true);
          }}
        />
      )}

      {/* Future CommentModal integration can go here */}
      {/* {showComments && (
        <CommentModal postId={selectedPostId} onClose={() => setShowComments(false)} />
      )} */}
    </>
  );
}
