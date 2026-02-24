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
import '@/features/ui/modern/module-modern.css'

export default function ConversationScreen() {
  const { conversationId } = useParams()
  useIdentity()

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
    <div className="module-modern-page flex min-h-0 flex-1 flex-col text-white">
      <ConversationView conversationId={conversationId} />
    </div>
  )
}
