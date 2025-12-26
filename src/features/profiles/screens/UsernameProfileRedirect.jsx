import { Navigate, useParams } from 'react-router-dom'
import { useUsernameProfileRedirect } from '@/features/profiles/hooks/useUsernameProfileRedirect'

const UUID_REGEX = /^[0-9a-f-]{36}$/i

export default function UsernameProfileRedirect() {
  const { username } = useParams()

  // 🔒 If someone hits this route with a UUID, just forward
  if (UUID_REGEX.test(username)) {
    return <Navigate to={`/profile/${username}`} replace />
  }

  const { actorId, loading } = useUsernameProfileRedirect(username)

  if (loading) {
    return <div className="p-10 text-center">Loading…</div>
  }

  if (!actorId) {
    return <div className="p-10 text-center">Profile not found.</div>
  }

  return <Navigate to={`/profile/${actorId}`} replace />
}
