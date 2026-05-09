import { Link } from 'react-router-dom'
import { useResetPassword } from '@/features/auth/hooks/useResetPassword'
import { authTheme } from '@/features/auth/styles/authTheme'
import '@/features/auth/styles/registerFormCard.css'
import { useTranslation } from '@i18n'

export default function ForgotPasswordScreen() {
  const { t } = useTranslation()

  const {
    email,
    setEmail,
    successMessage,
    errorMessage,
    loading,
    canSubmit,
    handleReset,
    goToLogin,
  } = useResetPassword()

  return (
    <div
      className="min-h-screen px-4 py-8 text-white"
      style={{ background: authTheme.pageBackground }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center justify-center">
        <div
          className="w-full rounded-2xl border border-white/10 p-6 sm:p-7"
          style={{
            background: authTheme.cardBackground,
            boxShadow: authTheme.cardShadow,
          }}
        >
          <div className="mb-6 space-y-1">
            <h1 className="text-center text-[1.65rem] font-semibold tracking-tight text-white">
              {t('auth.forgot.title')}
            </h1>
            <p className="text-center text-sm text-[#9ca3af]">
              {t('auth.forgot.subtitle')}
            </p>
          </div>

          {successMessage ? (
            <div className="space-y-4">
              <div
                className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-3 text-sm text-[#86efac]"
                role="status"
              >
                {successMessage}
              </div>

              <p className="text-center text-xs text-[#9ca3af]">
                {t('auth.forgot.redirecting')}
              </p>

              <button
                type="button"
                onClick={goToLogin}
                className="w-full rounded-xl bg-[#6C4DF6] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(108,77,246,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#7657ff] active:translate-y-0"
              >
                {t('auth.forgot.backToLogin')}
              </button>
            </div>
          ) : (
            <>
              {errorMessage ? (
                <div
                  className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]"
                  role="alert"
                >
                  {errorMessage}
                </div>
              ) : null}

              <form className="mt-4 space-y-4" onSubmit={handleReset} noValidate>
                <div className="space-y-1.5">
                  <label
                    htmlFor="forgot-email"
                    className="text-xs font-medium tracking-wide text-[#d1d5db]"
                  >
                    {t('auth.email')}
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={[
                      'auth-register-input w-full rounded-xl border border-white/10 bg-white/[0.03]',
                      'px-3 py-2.5 text-sm text-white placeholder:text-[#9ca3af] outline-none',
                      'transition duration-200 focus:border-[#6C4DF6]/80 focus:ring-2 focus:ring-[#6C4DF6]/40',
                      'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                    ].join(' ')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={[
                    'mt-1 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200',
                    canSubmit
                      ? 'bg-[#6C4DF6] shadow-[0_10px_30px_rgba(108,77,246,0.35)] hover:-translate-y-[1px] hover:bg-[#7657ff] active:translate-y-0'
                      : 'cursor-not-allowed bg-white/10 text-white/60 shadow-none',
                  ].join(' ')}
                >
                  {loading ? t('auth.forgot.sending') : t('auth.forgot.sendResetLink')}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-1 block w-full rounded-xl bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white/60 no-underline transition-all duration-200 hover:bg-white/15 hover:text-white"
              >
                {t('auth.forgot.backToLogin')}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
