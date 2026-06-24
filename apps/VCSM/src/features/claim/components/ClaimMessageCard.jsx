// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — terminal/info states for the claim funnel
// (loading, invalid link, already claimed, pending confirmation).

import { Link } from 'react-router-dom'
import { claimSecondaryButtonClass } from '@/features/claim/components/claimStyles'

export default function ClaimMessageCard({
  title,
  body,
  tone = 'neutral', // 'neutral' | 'success' | 'error'
  showHome = false,
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[#86efac]'
      : tone === 'error'
        ? 'text-[#fca5a5]'
        : 'text-white'

  return (
    <div className="space-y-4 text-center">
      <h1 className={`text-[1.4rem] font-semibold tracking-tight ${toneClass}`}>
        {title}
      </h1>
      {body ? <p className="text-sm text-[#9ca3af]">{body}</p> : null}
      {showHome ? (
        <Link to="/" className={`${claimSecondaryButtonClass} inline-block`}>
          Go to Vibez Citizens
        </Link>
      ) : null}
    </div>
  )
}
