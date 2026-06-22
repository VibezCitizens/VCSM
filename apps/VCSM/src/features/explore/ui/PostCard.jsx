import { useNavigate } from 'react-router-dom'

export default function PostCard({ post }) {
  const navigate = useNavigate()

  if (!post?.id) return null

  const preview = post.title || post.text || ''
  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 4) : []

  return (
    <button
      type="button"
      onClick={post.slug ? () => navigate(`/posts/${post.slug}`) : undefined}
      className="explore-post-card"
    >
      {preview ? (
        <p className="explore-post-card-text">{preview}</p>
      ) : null}
      {tags.length > 0 ? (
        <div className="explore-post-tags">
          {tags.map((t) => (
            <span key={t} className="explore-post-tag">#{t}</span>
          ))}
        </div>
      ) : null}
    </button>
  )
}
