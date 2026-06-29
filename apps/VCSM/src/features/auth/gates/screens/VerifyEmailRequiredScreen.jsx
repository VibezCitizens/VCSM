import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useResendVerification } from '@/features/auth/gates/hooks/useResendVerification'
import { authTheme } from '@/features/auth/shared/styles/authTheme'

const REDIRECT_SECONDS = 4

export default function VerifyEmailRequiredScreen({ email: emailProp }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { loading, sent, error, cooldownSeconds, resend } = useResendVerification()

  const email = emailProp || location.state?.email || null

  // TICKET-TRAZE-CLAIM-AUTH-CONTEXT-FIX-001 (BUG-2): preserve the claim return path
  // through the auto-redirect to /login so a same-browser manual login (rather than
  // clicking the email link) still restores the claim. useLogin re-validates it.
  const returnTo = typeof location.state?.from === 'string' ? location.state.from : null

  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          navigate('/login', { replace: true, state: returnTo ? { from: returnTo } : undefined })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [navigate, returnTo])

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-5 text-white"
      style={{
        background: authTheme.pageBackground,
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="w-full max-w-[400px] rounded-3xl border border-white/10 px-6 py-8 sm:px-8 sm:py-9"
        style={{
          background: authTheme.cardBackground,
          boxShadow: authTheme.cardShadow,
        }}
      >
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C4DF6]/30 to-[#6C4DF6]/5 ring-1 ring-inset ring-white/10">
            <div className="absolute inset-0 rounded-2xl bg-[#6C4DF6]/20 blur-xl" aria-hidden="true" />
            <Mail className="relative h-8 w-8 text-[#a78bfa]" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-center text-[22px] font-semibold leading-tight tracking-tight text-white">
          Check your email
        </h1>
        <p className="mx-auto mt-2 max-w-[19rem] text-center text-[15px] leading-relaxed text-[#9ca3af]">
          If this email is eligible, we sent a secure confirmation link. If you already have an account, log in instead.
        </p>

        {email ? (
          <div className="mx-auto mt-5 flex max-w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
            <Mail className="h-4 w-4 shrink-0 text-[#6b7280]" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate text-sm font-medium text-[#c4c9d4]">{email}</span>
          </div>
        ) : null}

        {error ? (
          <div
            className="mt-5 rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-center text-sm text-[#fecaca]"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {sent ? (
          <div
            className="mt-5 rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-center text-sm text-[#86efac]"
            role="status"
          >
            Confirmation email resent. Check your inbox.
          </div>
        ) : null}

        {email ? (
          <>
            <button
              type="button"
              disabled={loading || sent || cooldownSeconds > 0}
              onClick={() => resend(email)}
              className={[
                'mt-7 w-full rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white transition-all duration-200',
                !loading && !sent && cooldownSeconds === 0
                  ? 'bg-[#6C4DF6] shadow-[0_10px_30px_rgba(108,77,246,0.35)] hover:-translate-y-[1px] hover:bg-[#7657ff] active:translate-y-0'
                  : 'cursor-not-allowed bg-white/10 text-white/60 shadow-none',
              ].join(' ')}
            >
              {loading ? 'Sending…' : sent ? 'Email sent' : 'Resend confirmation email'}
            </button>

            {cooldownSeconds > 0 && !loading ? (
              <p className="mt-3 text-center text-xs text-[#6b7280]">
                Resend available in {cooldownSeconds}s.
              </p>
            ) : null}
          </>
        ) : null}

        <p className="mt-6 text-center text-xs text-[#4b5563]">
          {countdown > 0
            ? `Redirecting to login in ${countdown}s…`
            : 'Redirecting…'}
        </p>
      </div>
    </div>
  )
}
