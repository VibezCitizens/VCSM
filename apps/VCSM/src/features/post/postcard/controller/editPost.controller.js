// src/features/posts/controllers/editPost.controller.js
import { updatePostTextDAL } from '@/features/post/postcard/dal/post.write.dal'

export async function editPostController({ actorId, postId, text }) {
  if (!actorId) return { ok: false, error: new Error('actorId required') }
  if (!postId) return { ok: false, error: new Error('postId required') }

  const trimmed = String(text ?? '').trim()
  if (!trimmed) return { ok: false, error: new Error('Post text cannot be empty') }

  const { data, error } = await updatePostTextDAL({ actorId, postId, text: trimmed })

  if (error) return { ok: false, error }
  if (!data) return { ok: false, error: new Error('Post not found or not owned') }

  return { ok: true, post: data }
}
