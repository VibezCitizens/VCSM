import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import ConsentCheckbox from './ConsentCheckbox'
import { useTranslation } from '@i18n'

function inputClass() {
  return [
    'auth-register-input w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white',
    'placeholder:text-[var(--vc-text-muted)] outline-none transition duration-200',
    'focus:border-[var(--vc-cta-border)] focus:ring-2 focus:ring-[var(--vc-cta-ring)]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  ].join(' ')
}

function PasswordRuleItem({ label, valid }) {
  return (
    <li className="flex items-center gap-2 text-xs text-[var(--vc-text-muted)]">
      {valid ? (
        <CheckCircle2
          size={14}
          className="text-[var(--vc-success)] transition-all duration-200 ease-out"
          aria-hidden="true"
        />
      ) : (
        <XCircle size={14} className="text-[var(--vc-text-muted)] opacity-80 transition-colors duration-200" aria-hidden="true" />
      )}
      <span className={valid ? 'text-[var(--vc-success)] transition-colors duration-200' : 'text-[var(--vc-text-muted)]'}>
        {label}
      </span>
    </li>
  )
}

export default function RegisterFormCard({
  form,
  termsAccepted,
  consentError,
  loading,
  errorMessage,
  successMessage,
  navState,
  canSubmit,
  cooldownSeconds,
  showPassword,
  showConfirmPassword,
  passwordRules,
  showPasswordRules,
  confirmPasswordState,
  onInputChange,
  onSubmit,
  onBackClick,
  onToggleTermsAccepted,
  onTogglePassword,
  onToggleConfirmPassword,
}) {
  const { t } = useTranslation()

  return (
    <div
      className="min-h-screen px-4 py-8 text-white"
      style={{
        background:
          'radial-gradient(900px 500px at 15% 10%, var(--vc-gradient-a), transparent 60%), radial-gradient(800px 420px at 85% 90%, var(--vc-gradient-b), transparent 60%), var(--vc-bg-0)',
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center justify-center">
        <div
          className="w-full rounded-2xl border border-white/10 p-6 sm:p-7"
          style={{
            background: 'var(--vc-card-bg)',
            boxShadow:
              '0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div className="mb-6 space-y-1">
            <h1 className="text-center text-[1.65rem] font-semibold tracking-tight text-white">
              {t('auth.register.title')}
            </h1>
            <p className="text-center text-sm text-[var(--vc-text-muted)]">
              {t('auth.register.subtitle')}
            </p>
          </div>

          {successMessage ? (
            <div
              className="mb-4 rounded-xl border border-[var(--vc-success-border)] bg-[var(--vc-success-bg)] px-3 py-2 text-sm text-[var(--vc-success-text)]"
              role="status"
              aria-live="polite"
            >
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div
              className="mb-4 rounded-xl border border-[var(--vc-error-border)] bg-[var(--vc-error-bg)] px-3 py-2 text-sm text-[var(--vc-error-text)]"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="text-xs font-medium tracking-wide text-[var(--vc-text-soft)]">
                {t('auth.email')}
              </label>
              <input
                id="register-email"
                className={inputClass()}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={onInputChange}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-password" className="text-xs font-medium tracking-wide text-[var(--vc-text-soft)]">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  className={`${inputClass()} pr-10`}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('auth.register.passwordPlaceholder')}
                  value={form.password}
                  onChange={onInputChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--vc-text-muted)] transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--vc-cta-ring)]"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {!showPasswordRules ? (
                <p className="pt-1 text-xs text-[var(--vc-text-muted)]">
                  {t('auth.register.passwordHint')}
                </p>
              ) : (
                <ul className="space-y-1.5 pt-1" aria-live="polite">
                  {passwordRules.map((rule) => (
                    <PasswordRuleItem key={rule.key} label={rule.label} valid={rule.valid} />
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-confirm-password" className="text-xs font-medium tracking-wide text-[var(--vc-text-soft)]">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  className={`${inputClass()} pr-10`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                  value={form.confirmPassword}
                  onChange={onInputChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={onToggleConfirmPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--vc-text-muted)] transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--vc-cta-ring)]"
                  aria-label={showConfirmPassword ? t('auth.hideConfirmPassword') : t('auth.showConfirmPassword')}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {confirmPasswordState.state !== 'idle' ? (
                <div
                  className={[
                    'flex items-center gap-2 pt-1 text-xs transition-colors duration-200',
                    confirmPasswordState.state === 'match' ? 'text-[var(--vc-success)]' : 'text-[var(--vc-error)]',
                  ].join(' ')}
                  aria-live="polite"
                >
                  {confirmPasswordState.state === 'match' ? (
                    <CheckCircle2 size={14} aria-hidden="true" />
                  ) : (
                    <XCircle size={14} aria-hidden="true" />
                  )}
                  <span>{confirmPasswordState.message}</span>
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5 pt-1">
              <ConsentCheckbox checked={termsAccepted} onChange={onToggleTermsAccepted}>
                {t('auth.register.consentPrefix')}{' '}
                <Link
                  to="/legal/terms-of-service"
                  target="_blank"
                  className="font-medium text-[var(--vc-link)] underline decoration-[var(--vc-link)] transition hover:text-[var(--vc-link-hover)] hover:decoration-[var(--vc-link-hover)]"
                >
                  {t('auth.termsOfService')}
                </Link>
                {' '}{t('auth.register.consentAnd')}{' '}
                <Link
                  to="/legal/privacy-policy"
                  target="_blank"
                  className="font-medium text-[var(--vc-link)] underline decoration-[var(--vc-link)] transition hover:text-[var(--vc-link-hover)] hover:decoration-[var(--vc-link-hover)]"
                >
                  {t('auth.privacyPolicy')}
                </Link>
                {' '}{t('auth.register.consentSuffix')}
              </ConsentCheckbox>

              {consentError ? (
                <div
                  className="flex items-start gap-2 pl-[30px] text-xs text-[var(--vc-error)]"
                  role="alert"
                  aria-live="polite"
                >
                  <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{consentError}</span>
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                'mt-1 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200',
                canSubmit
                  ? 'bg-[var(--vc-cta)] shadow-[var(--vc-cta-shadow)] hover:-translate-y-[1px] hover:bg-[var(--vc-cta-hover)] active:translate-y-0'
                  : 'cursor-not-allowed bg-white/10 text-white/60 shadow-none',
              ].join(' ')}
            >
              {loading ? t('auth.register.creating') : t('auth.createAccount')}
            </button>
          </form>

          {cooldownSeconds > 0 && !loading ? (
            <p className="text-center text-xs text-[var(--vc-text-muted)]">
              Please wait {cooldownSeconds}s before trying again.
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            <Link
              to="/login"
              state={navState}
              className="font-medium text-[var(--vc-link)] no-underline transition hover:text-[var(--vc-link-hover)]"
            >
              {t('auth.alreadyHaveAccount')}
            </Link>

            <button
              type="button"
              onClick={onBackClick}
              className="rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--vc-cta-ring)]"
            >
              {t('actions.back')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
