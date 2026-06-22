// src/features/auth/login/screens/LoginScreen.jsx
// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Scope: Global migration pass
// @Note: Do NOT remove, rename, or modify this block.

import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { ChevronRight, Smartphone, Sparkles } from 'lucide-react'
import { getActiveSeasonTheme } from '@/season'
import { authTheme } from '@/features/auth/shared/styles/authTheme'
import { useLogin } from '@/features/auth/login/hooks/useLogin'
import { useTranslation } from '@i18n'

// iOS install modal
import IosInstallPrompt from '@/app/platform/ios/components/IosInstallPrompt'
import { useIOSInstallVisibility } from '@/app/platform/ios/useIOSInstallVisibility'

function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const season = getActiveSeasonTheme('topRight')

  const { t } = useTranslation()

  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    canSubmit,
    cooldownSeconds,
    handleLogin,
  } = useLogin(navigate, location)

  const accountDeleted = location?.state?.accountDeleted === true
  const emailConfirmed = location?.state?.emailConfirmed === true
  const passwordReset = location?.state?.passwordReset === true

  // LOKI SS-01/SS-02/SS-03: suppress nav-state banners when a login error is present
  // to prevent conflicting success/error messages rendering simultaneously.
  const showEmailConfirmed = emailConfirmed && !error
  const showAccountDeleted = accountDeleted && !error
  const showPasswordReset = passwordReset && !error

  const navState = useMemo(() => {
    const s = location?.state || {}
    return {
      from: typeof s.from === 'string' ? s.from : null,
      card: typeof s.card === 'string' ? s.card : null,
    }
  }, [location])

  const { canShowInstall, showInstall, openInstall, dismissInstall } = useIOSInstallVisibility()

  const onSubmit = async (e) => {
    await handleLogin(e)
  }

  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center px-4 text-white"
        style={{ background: authTheme.pageBackground }}
      >
        {season.fog1 && <div className={season.fog1} />}
        {season.fog2 && <div className={season.fog2} />}

        <div className="w-full max-w-md mx-auto">
          <div className="relative">
            {season.hatPosition && season.hatClassMap && (
              <img
                src="/season/xmas/XmasHat.png"
                alt="Xmas Hat"
                className={`w-72 pointer-events-none z-50 ${season.hatClassMap[season.hatPosition]}`}
              />
            )}

            <form
              onSubmit={onSubmit}
              className="relative w-full space-y-5 overflow-hidden border border-white/10 p-6 sm:p-8 rounded-2xl"
              style={{
                background: authTheme.cardBackground,
                boxShadow: authTheme.cardShadow,
              }}
            >

              <div className="relative text-center">
                <h1 className="font-serif text-[clamp(2.45rem,9.6vw,3.35rem)] font-semibold leading-[0.96] tracking-[0.005em] whitespace-nowrap text-transparent bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 bg-clip-text">
                  {t('auth.login.title')}
                </h1>
                <p className="mt-2 text-sm tracking-[0.08em] text-amber-100/80">
                  {t('auth.login.tagline')}
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs font-medium tracking-wide text-[var(--vc-text-soft)]">
                  {t('auth.email')}
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  inputMode="email"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-[var(--vc-text-muted)] outline-none transition duration-200 focus:border-[var(--vc-cta-border)] focus:ring-2 focus:ring-[var(--vc-cta-ring)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs font-medium tracking-wide text-[var(--vc-text-soft)]">
                  {t('auth.password')}
                </label>
                <input
                  id="login-password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-[var(--vc-text-muted)] outline-none transition duration-200 focus:border-[var(--vc-cta-border)] focus:ring-2 focus:ring-[var(--vc-cta-ring)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                />
              </div>

              {showEmailConfirmed && (
                <div
                  className="rounded-xl border border-[var(--vc-success-border)] bg-[var(--vc-success-bg)] px-3 py-2.5 text-sm text-[var(--vc-success-text)]"
                  role="status"
                  aria-live="polite"
                >
                  <p className="font-semibold">{t('auth.login.emailConfirmedTitle')}</p>
                  <p className="mt-0.5 text-[var(--vc-success-text-soft)] text-xs">{t('auth.login.emailConfirmedBody')}</p>
                </div>
              )}

              {showPasswordReset && (
                <div
                  className="rounded-xl border border-[var(--vc-success-border)] bg-[var(--vc-success-bg)] px-3 py-2.5 text-sm text-[var(--vc-success-text)]"
                  role="status"
                  aria-live="polite"
                >
                  <p className="font-semibold">{t('auth.login.passwordResetTitle')}</p>
                  <p className="mt-0.5 text-[var(--vc-success-text-soft)] text-xs">{t('auth.login.passwordResetBody')}</p>
                </div>
              )}

              {showAccountDeleted && (
                <div
                  className="rounded-xl border border-[var(--vc-warning-border)] bg-[var(--vc-warning-bg)] px-3 py-2.5 text-sm text-[var(--vc-warning-text)]"
                  role="alert"
                  aria-live="polite"
                >
                  <p className="font-semibold">{t('auth.login.accountNotFoundTitle')}</p>
                  <p className="mt-0.5 text-[var(--vc-warning-text-soft)] text-xs">{t('auth.login.accountNotFoundBody')}</p>
                </div>
              )}

              {error && (
                <div
                  className="rounded-xl border border-[var(--vc-error-border)] bg-[var(--vc-error-bg)] px-3 py-2 text-sm text-[var(--vc-error-text)]"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className={[
                  'relative mt-1 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200',
                  canSubmit
                    ? 'bg-[var(--vc-cta)] shadow-[var(--vc-cta-shadow)] hover:-translate-y-[1px] hover:bg-[var(--vc-cta-hover)] active:translate-y-0'
                    : 'cursor-not-allowed bg-white/10 text-white/60 shadow-none',
                ].join(' ')}
              >
                <span
                  className="absolute -top-3 -right-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-[var(--vc-badge-beta-glow)]"
                >
                  Beta
                </span>

                {loading ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
              </button>

              {cooldownSeconds > 0 && !loading ? (
                <p className="text-center text-xs text-[#9ca3af]">
                  Too many attempts. Try again in {cooldownSeconds}s.
                </p>
              ) : null}

              <div className="flex items-center justify-between pt-2 text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-[var(--vc-link)] no-underline transition hover:text-[var(--vc-link-hover)]"
                >
                  {t('auth.forgotPassword')}
                </Link>

                <Link
                  to="/register"
                  state={navState}
                  className="font-medium text-[var(--vc-link)] no-underline transition hover:text-[var(--vc-link-hover)]"
                >
                  {t('auth.createAccount')}
                </Link>
              </div>

              {canShowInstall && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={openInstall}
                    className="
                      group relative w-full overflow-hidden rounded-2xl border border-cyan-300/30
                      bg-gradient-to-r from-cyan-400/15 via-indigo-400/10 to-sky-400/10
                      px-4 py-3 text-left transition hover:border-cyan-200/45 hover:brightness-110
                    "
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-300/25 blur-2xl" />
                    <div className="pointer-events-none absolute -left-12 -bottom-10 h-24 w-24 rounded-full bg-purple-300/15 blur-2xl" />

                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/35 bg-cyan-300/15 text-cyan-100">
                          <Smartphone size={17} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                            {t('auth.login.installTitle')}
                            <Sparkles size={14} className="text-cyan-200" />
                          </div>
                          <div className="text-xs text-white/70">
                            {t('auth.login.installSubtitle')}
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        size={17}
                        className="text-cyan-100 transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </button>
                </div>
              )}
            </form>
          </div>

          <nav
            className="mt-8 text-center text-xs"
            aria-label="Site links"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            <Link to="/about" className="text-[var(--vc-link)] transition hover:text-[var(--vc-link-hover)]">{t('nav.about')}</Link>
            <span className="mx-2" style={{ color: 'rgba(255,255,255,0.22)' }}>·</span>
            <Link to="/contact" className="text-[var(--vc-link)] transition hover:text-[var(--vc-link-hover)]">{t('nav.contact')}</Link>
            <span className="mx-2" style={{ color: 'rgba(255,255,255,0.22)' }}>·</span>
            <Link to="/legal/privacy-policy" className="text-[var(--vc-link)] transition hover:text-[var(--vc-link-hover)]">{t('nav.privacy')}</Link>
            <span className="mx-2" style={{ color: 'rgba(255,255,255,0.22)' }}>·</span>
            <Link to="/legal/terms-of-service" className="text-[var(--vc-link)] transition hover:text-[var(--vc-link-hover)]">{t('nav.terms')}</Link>
          </nav>
        </div>
      </div>

      <IosInstallPrompt
        open={showInstall}
        onClose={dismissInstall}
      />
    </>
  )
}

export default LoginScreen
