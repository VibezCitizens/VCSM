// src/features/profiles/screens/ActorProfileScreen.jsx

import { useParams, Navigate } from 'react-router-dom'
import { useIdentity } from '@/state/identity/identityContext'
import ActorProfileViewScreen from './views/ActorProfileViewScreen'

const UUID_REGEX = /^[0-9a-f-]{36}$/i

export default function ActorProfileScreen() {
  const { actorId: routeActorId } = useParams()
  const { identity, identityLoading } = useIdentity()

  if (identityLoading) {
    return <div className="p-10 text-center">Loading…</div>
  }

  if (!identity) {
    return <Navigate to="/login" replace />
  }

  if (routeActorId === 'self') {
    return (
      <ActorProfileViewScreen
        viewerActorId={identity.actorId}
        profileActorId={identity.actorId}
      />
    )
  }

  if (!UUID_REGEX.test(routeActorId)) {
    return <Navigate to={`/u/${routeActorId}`} replace />
  }

  return (
    <ActorProfileViewScreen
      viewerActorId={identity.actorId}
      profileActorId={routeActorId}
    />
  )
}
