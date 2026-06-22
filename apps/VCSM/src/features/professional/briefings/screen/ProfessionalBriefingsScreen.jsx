import { Navigate } from 'react-router-dom'

import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import ProfessionalBriefingsScreenView from '@/features/professional/briefings/view/ProfessionalBriefingsScreenView'

export default function ProfessionalBriefingsScreen() {
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null

  if (!actorId) return <Navigate to="/CentralFeed" replace />

  return <ProfessionalBriefingsScreenView actorId={actorId} />
}
