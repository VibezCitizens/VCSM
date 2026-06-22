import { Link } from 'react-router-dom'
import { useSetNewPassword } from '@/features/auth/password-recovery/hooks/useSetNewPassword'
import { authTheme } from '@/features/auth/shared/styles/authTheme'
import '@/features/auth/shared/styles/registerFormCard.css'

function PasswordRuleRow({ valid, label }) {
  return (
    <li className={['flex items-center gap-1.5 text-xs', valid ? 'text-[#86efac]' : 'text-[#9ca3af]'].join(' ')}>
      <span className="text-[10px]">{valid ? '✓' : '·'}</span>
      {label}
    </li>
  )
}

export default function ResetPasswordScreen() {
  const {
    status,
    form,
    saving,
    errorMessage,
    passwordValidation,
    confirmPasswordValidation,
    showPassword,
    showConfirmPassword,
    showPasswordRules,
    canSubmit,
    handleChange,
    handleSubmit,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  } = useSetNewPassword()

  if (status === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: authTheme.pageBackground }}
      >
        <div className="animate-pulse text-sm text-[#9ca3af]">Verifying reset link…</div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div
        className="min-h-screen px-4 py-8 text-white flex items-center justify-center"
        style={{ background: authTheme.pageBackground }}
      >
        <div
          className="w-full max-w-[420px] rounded-2xl border border-white/10 p-6 sm:p-7 text-center"
          style={{ background: authTheme.cardBackground, boxShadow: authTheme.cardShadow }}
        >
          <h1 className="mb-2 text-[1.3rem] font-semibold text-white">Link expired</h1>
          <p className="mb-6 text-sm text-[#9ca3af]">
            {errorMessage || 'This reset link is invalid or has expired.'}
          </p>
          <Link
            to="/forgot-password"
            className="block w-full rounded-xl bg-[#6C4DF6] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(108,77,246,0.35)] transition-all hover:-translate-y-[1px] hover:bg-[#7657ff]"
          >
            Request a new link
          </Link>
          <Link
            to="/login"
            className="mt-3 block text-center text-sm text-[#a78bfa] transition-colors hover:text-white"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen px-4 py-8 text-white"
      style={{ background: authTheme.pageBackground }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center justify-center">
        <div
          className="w-full rounded-2xl border border-white/10 p-6 sm:p-7"
          style={{ background: authTheme.cardBackground, boxShadow: authTheme.cardShadow }}
        >
          <div className="mb-6 space-y-1">
            <h1 className="text-center text-[1.65rem] font-semibold tracking-tight text-white">
              Set new password
            </h1>
            <p className="text-center text-sm text-[#9ca3af]">
              Choose a strong password for your account.
            </p>
          </div>

          {errorMessage ? (
            <div
              className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* New password */}
            <div className="space-y-1.5">
              <label
                htmlFor="reset-password"
                className="text-xs font-medium tracking-wide text-[#d1d5db]"
              >
                New password
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  placeholder="New password"
                  value={form.password}
                  onChange={handleChange}
                  className={[
                    'auth-register-input w-full rounded-xl border border-white/10 bg-white/[0.03]',
                    'px-3 py-2.5 pr-10 text-sm text-white placeholder:text-[#9ca3af] outline-none',
                    'transition duration-200 focus:border-[#6C4DF6]/80 focus:ring-2 focus:ring-[#6C4DF6]/40',
                    'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>

              {showPasswordRules ? (
                <ul className="mt-1.5 space-y-0.5 pl-0.5">
                  {passwordValidation.rules.map((rule) => (
                    <PasswordRuleRow key={rule.key} valid={rule.valid} label={rule.label} />
                  ))}
                </ul>
              ) : null}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label
                htmlFor="reset-confirm-password"
                className="text-xs font-medium tracking-wide text-[#d1d5db]"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={[
                    'auth-register-input w-full rounded-xl border border-white/10 bg-white/[0.03]',
                    'px-3 py-2.5 pr-10 text-sm text-white placeholder:text-[#9ca3af] outline-none',
                    'transition duration-200 focus:border-[#6C4DF6]/80 focus:ring-2 focus:ring-[#6C4DF6]/40',
                    'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '🙈' : '👁'}
                </button>
              </div>

              {form.confirmPassword.length > 0 ? (
                <p
                  className={[
                    'mt-1 text-xs',
                    confirmPasswordValidation.matches ? 'text-[#86efac]' : 'text-[#fca5a5]',
                  ].join(' ')}
                >
                  {confirmPasswordValidation.message}
                </p>
              ) : null}
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
              {saving ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
