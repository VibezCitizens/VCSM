import { Link } from 'react-router-dom'
import { useResendVerification } from '@/features/auth/hooks/useResendVerification'
import { authTheme } from '@/features/auth/styles/authTheme'

export default function VerifyEmailRequiredScreen({ email }) {
  const { loading, sent, error, resend } = useResendVerification()

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
            Verify your email
          </h1>
          <p className="text-sm text-[#9ca3af]">
            You must verify your email address before continuing.
          </p>
        </div>

        {email ? (
          <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-[#d1d5db]">
            A verification link was sent to{' '}
            <span className="font-medium text-white">{email}</span>
          </p>
        ) : null}

        <p className="mb-6 text-center text-sm text-[#9ca3af]">
          Click the link in your email to activate your account, then log in here.
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
            Verification email resent. Check your inbox.
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
            {loading ? 'Sending…' : sent ? 'Email sent' : 'Resend verification email'}
          </button>
        ) : null}

        <Link
          to="/login"
          replace
          className="block w-full rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-[#d1d5db] transition-colors hover:border-white/20 hover:text-white"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
