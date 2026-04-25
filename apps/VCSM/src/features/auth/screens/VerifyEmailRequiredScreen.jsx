import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useResendVerification } from '@/features/auth/hooks/useResendVerification'
import { authTheme } from '@/features/auth/styles/authTheme'

const REDIRECT_SECONDS = 4

export default function VerifyEmailRequiredScreen({ email: emailProp }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { loading, sent, error, resend } = useResendVerification()

  const email = emailProp || location.state?.email || null

  const [countdown, setCountdown] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          navigate('/login', { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div
      className="min-h-screen px-4 py-8 text-white flex items-center justify-center"
      style={{ background: authTheme.pageBackground }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl border border-white/10 p-6 sm:p-7"
        style={{
          background: authTheme.cardBackground,
          boxShadow: authTheme.cardShadow,
        }}
      >
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-white">
            Check your email
          </h1>
          <p className="text-sm text-[#9ca3af]">
            Check your email to confirm your account.
          </p>
        </div>

        {email ? (
          <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-[#d1d5db]">
            A confirmation link was sent to{' '}
            <span className="font-medium text-white">{email}</span>
          </p>
        ) : null}

        <p className="mb-6 text-center text-sm text-[#9ca3af]">
          After confirming, return and log in.
        </p>

        {error ? (
          <div
            className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-center text-sm text-[#fecaca]"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {sent ? (
          <div
            className="mb-4 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2 text-center text-sm text-[#86efac]"
            role="status"
          >
            Confirmation email resent. Check your inbox.
          </div>
        ) : null}

        {email ? (
          <button
            type="button"
            disabled={loading || sent}
            onClick={() => resend(email)}
            className={[
              'mb-3 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200',
              !loading && !sent
                ? 'bg-[#6C4DF6] shadow-[0_10px_30px_rgba(108,77,246,0.35)] hover:-translate-y-[1px] hover:bg-[#7657ff] active:translate-y-0'
                : 'cursor-not-allowed bg-white/10 text-white/60 shadow-none',
            ].join(' ')}
          >
            {loading ? 'Sending…' : sent ? 'Email sent' : 'Resend confirmation email'}
          </button>
        ) : null}

        <p className="mt-4 text-center text-xs text-[#6b7280]">
          {countdown > 0
            ? `Redirecting to login in ${countdown}s…`
            : 'Redirecting…'}
        </p>
      </div>
    </div>
  )
}
