// src/features/vport/screens/VportScreen.jsx

import { useParams, Navigate } from 'react-router-dom'
import { useIdentity } from '@/state/identity/identityContext'
import VportViewScreen from './views/VportViewScreen'

export default function VportScreen() {
  const { vportId } = useParams()
  const { identity, identityLoading } = useIdentity()

  if (identityLoading) {
    return <div className="p-10 text-center">Loading identity…</div>
  }

  if (!identity) {
    return <Navigate to="/login" replace />
  }

  if (!vportId) {
    return <div className="p-10 text-center">Vport not found</div>
  }

  return (
    <VportViewScreen
      viewerActorId={identity.actorId}
      vportId={vportId}
    />
  )
}
