import PostCard from '@/components/PostCard';

export default function PostList({ posts, user }) {
  // Only show posts that have text but no media
  const textOnlyPosts = posts.filter(
    post =>
      post?.text?.trim()?.length > 0 &&
      !post.media_url // exclude media posts
  );

  if (textOnlyPosts.length === 0) {
    return <p className="text-center text-neutral-500">No text-only posts found.</p>;
  }

  return (
    <div className="space-y-4">
      {textOnlyPosts.map(post => (
        <PostCard key={post.id} post={post} user={user} />
      ))}
    </div>
  );
}