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
        className="w-full max-w-[420px] rounded-2xl border border-white/10 p-7 sm:p-8"
        style={{
          background: authTheme.cardBackground,
          boxShadow: authTheme.cardShadow,
        }}
      >
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#6C4DF6]/20">
            <Mail className="h-7 w-7 text-[#a78bfa]" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="mb-1.5 text-center text-xl font-semibold tracking-tight text-white">
          Check your email
        </h1>
        <p className="mb-6 text-center text-sm text-[#9ca3af]">
          A secure link may be on its way to your inbox.
        </p>

        <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-sm leading-relaxed text-[#c4c9d4]">
            If this email is eligible for confirmation, we sent a link. If you already have an account, log in instead.
          </p>
        </div>

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
          <>
            <button
              type="button"
              disabled={loading || sent || cooldownSeconds > 0}
              onClick={() => resend(email)}
              className={[
                'w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200',
                !loading && !sent && cooldownSeconds === 0
                  ? 'bg-[#6C4DF6] shadow-[0_10px_30px_rgba(108,77,246,0.35)] hover:-translate-y-[1px] hover:bg-[#7657ff] active:translate-y-0'
                  : 'cursor-not-allowed bg-white/10 text-white/60 shadow-none',
              ].join(' ')}
            >
              {loading ? 'Sending…' : sent ? 'Email sent' : 'Resend confirmation email'}
            </button>

            {cooldownSeconds > 0 && !loading ? (
              <p className="text-center text-xs text-[#4b5563]">
                Resend available in {cooldownSeconds}s.
              </p>
            ) : null}
          </>
        ) : null}

        <p className="mt-3 text-center text-xs text-[#4b5563]">
          {countdown > 0
            ? `Redirecting to login in ${countdown}s…`
            : 'Redirecting…'}
        </p>
      </div>
    </div>
  )
}
