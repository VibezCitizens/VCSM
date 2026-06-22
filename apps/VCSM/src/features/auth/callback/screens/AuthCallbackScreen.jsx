import { Link } from 'react-router-dom'
import { useAuthCallback } from '@/features/auth/callback/hooks/useAuthCallback'
import { authTheme } from '@/features/auth/shared/styles/authTheme'

export default function AuthCallbackScreen() {
  const { error } = useAuthCallback()

  return (
    <div
      className="min-h-screen px-4 py-8 text-white flex items-center justify-center"
      style={{ background: authTheme.pageBackground }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl border border-white/10 p-6 sm:p-7 text-center"
        style={{
          background: authTheme.cardBackground,
          boxShadow: authTheme.cardShadow,
        }}
      >
        {error ? (
          <>
            <h1 className="mb-2 text-[1.3rem] font-semibold text-white">
              Verification failed
            </h1>
            <p className="mb-6 text-sm text-[#9ca3af]">{error}</p>
            <Link
              to="/login"
              replace
              className="block w-full rounded-xl bg-[#6C4DF6] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(108,77,246,0.35)] transition-all hover:-translate-y-[1px] hover:bg-[#7657ff]"
            >
              Go to login
            </Link>
          </>
        ) : (
          <>
            <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-white/20 border-t-[#6C4DF6]" />
            <p className="text-sm text-[#9ca3af]">Verifying your email…</p>
          </>
        )}
      </div>
    </div>
  )
}
