import { useState } from "react"
import { editPostController } from "@/features/post/postcard/controller/editPost.controller"

export function useEditPost() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function editPost({ actorId, postId, text }) {
    setLoading(true)
    setError(null)
    const result = await editPostController({ actorId, postId, text })
    setLoading(false)
    if (!result.ok) setError(result.error)
    return result
  }

  return { loading, error, editPost }
}
