import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authTheme, ConsentCheckbox } from '@/features/auth/adapters/auth.adapter'

/**
 * Consent gate screen shown when compliance engine detects outdated or missing consent.
 * Blocks app entry until all required documents are accepted.
 * Mirrors the registration screen's consent UX.
 */
export default function ConsentGateScreen({ requiredActions, accepting, error, onAccept }) {
  const [termsAccepted, setTermsAccepted] = useState(false)

  const hasOutdated = requiredActions.some((a) => a.current_version != null)

  function getDocRoute(action) {
    if (action.content_url) return action.content_url
    if (action.consent_type === 'privacy_policy') return '/legal/privacy-policy'
    if (action.consent_type === 'terms_of_service') return '/legal/terms-of-service'
    return '#'
  }

  const tosAction = requiredActions.find((a) => a.consent_type === 'terms_of_service')
  const ppAction = requiredActions.find((a) => a.consent_type === 'privacy_policy')

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 text-white"
      style={{ background: authTheme.pageBackground }}
    >
      <div
        className="max-w-[420px] w-full rounded-2xl border border-white/10 p-6 sm:p-7"
        style={{
          background: authTheme.cardBackground,
          boxShadow: authTheme.cardShadow,
        }}
      >
        <div className="mb-6 space-y-1">
          <h1 className="text-center text-[1.65rem] font-semibold tracking-tight text-white">
            {hasOutdated ? 'Updated Policies' : 'Review Our Policies'}
          </h1>
          <p className="text-center text-sm text-[#9ca3af]">
            {hasOutdated
              ? 'We\'ve updated our policies. Please review and accept to continue.'
              : 'Please review and accept our policies to continue using Vibez Citizens.'}
          </p>
        </div>

        {/* Version info for each required doc */}
        {requiredActions.length > 0 && (
          <div className="mb-5 space-y-2">
            {requiredActions.map((action) => (
              <div
                key={action.legal_document_id}
                className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <Link
                  to={getDocRoute(action)}
                  target="_blank"
                  className="text-sm font-medium text-[#c4b5fd] underline decoration-[#c4b5fd]/40 transition hover:text-[#ddd6fe] hover:decoration-[#ddd6fe]/60"
                >
                  {action.title}
                </Link>
                <span className="text-xs text-[#9ca3af]">
                  v{action.required_version}
                  {action.current_version && (
                    <span className="text-[#ef4444]/60 ml-1">(was v{action.current_version})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Single consent checkbox — same pattern as registration */}
        <div className="mb-6">
          <ConsentCheckbox
            checked={termsAccepted}
            onChange={() => setTermsAccepted((prev) => !prev)}
          >
            I agree to the{hasOutdated ? ' updated ' : ' '}
            {tosAction ? (
              <Link
                to={getDocRoute(tosAction)}
                target="_blank"
                className="font-medium text-[#c4b5fd] underline decoration-[#c4b5fd]/40 transition hover:text-[#ddd6fe] hover:decoration-[#ddd6fe]/60"
              >
                Terms of Service
              </Link>
            ) : (
              <span className="font-medium text-[#c4b5fd]">Terms of Service</span>
            )}
            {' '}and{hasOutdated ? ' updated ' : ' '}
            {ppAction ? (
              <Link
                to={getDocRoute(ppAction)}
                target="_blank"
                className="font-medium text-[#c4b5fd] underline decoration-[#c4b5fd]/40 transition hover:text-[#ddd6fe] hover:decoration-[#ddd6fe]/60"
              >
                Privacy Policy
              </Link>
            ) : (
              <span className="font-medium text-[#c4b5fd]">Privacy Policy</span>
            )}
            {' '}and confirm that I am at least 18 years old.
          </ConsentCheckbox>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
            Something went wrong. Please try again.
          </div>
        )}

        <button
          onClick={onAccept}
          disabled={!termsAccepted || accepting}
          className={[
            'w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200',
            termsAccepted && !accepting
              ? 'bg-[#6C4DF6] shadow-[0_10px_30px_rgba(108,77,246,0.35)] hover:-translate-y-[1px] hover:bg-[#7657ff] active:translate-y-0'
              : 'cursor-not-allowed bg-white/10 text-white/60 shadow-none',
          ].join(' ')}
        >
          {accepting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
