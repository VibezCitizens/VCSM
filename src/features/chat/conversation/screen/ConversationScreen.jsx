// src/features/chat/screens/ConversationScreen.jsx (R)
// ============================================================
// ConversationScreen
// ------------------------------------------------------------
// - Routing + guards ONLY
// - No hooks
// - No UI composition
// ============================================================

import { useParams, Navigate } from 'react-router-dom'
import { useIdentity } from '@/state/identity/identityContext'

import ConversationView from '@/features/chat/conversation/screen/ConversationView'

export default function ConversationScreen() {
  const { conversationId } = useParams()
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null

  /* ============================================================
     Guards
     ============================================================ */

  if (!conversationId) {
    return <Navigate to="/inbox" replace />
  }

  /* ============================================================
     Render
     ============================================================ */

  return (
   <div className="flex flex-col flex-1 bg-black text-white min-h-0">
    <ConversationView conversationId={conversationId} />
  </div>
)

}
