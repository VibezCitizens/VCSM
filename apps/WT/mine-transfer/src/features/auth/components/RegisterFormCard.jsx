import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

function inputClass() {
  return [
    'auth-register-input w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white',
    'placeholder:text-[#9ca3af] outline-none transition duration-200',
    'focus:border-[#6C4DF6]/80 focus:ring-2 focus:ring-[#6C4DF6]/40',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  ].join(' ')
}

function PasswordRuleItem({ label, valid }) {
  return (
    <li className="flex items-center gap-2 text-xs text-[#9ca3af]">
      {valid ? (
        <CheckCircle2
          size={14}
          className="text-[#22c55e] transition-all duration-200 ease-out"
          aria-hidden="true"
        />
      ) : (
        <XCircle size={14} className="text-[#9ca3af]/80 transition-colors duration-200" aria-hidden="true" />
      )}
      <span className={valid ? 'text-[#22c55e] transition-colors duration-200' : 'text-[#9ca3af]'}>
        {label}
      </span>
    </li>
  )
}

export default function RegisterFormCard({
  form,
  loading,
  errorMessage,
  successMessage,
  navState,
  canSubmit,
  showPassword,
  showConfirmPassword,
  passwordRules,
  showPasswordRules,
  confirmPasswordState,
  onInputChange,
  onSubmit,
  onBackClick,
  onTogglePassword,
  onToggleConfirmPassword,
}) {
  return (
    <div
      className="min-h-screen px-4 py-8 text-white"
      style={{
        background:
          'radial-gradient(900px 500px at 15% 10%, rgba(108,77,246,0.15), transparent 60%), radial-gradient(800px 420px at 85% 90%, rgba(59,130,246,0.10), transparent 60%), #0b0b0f',
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center justify-center">
        <div
          className="w-full rounded-2xl border border-white/10 p-6 sm:p-7"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,20,26,0.98) 0%, rgba(20,20,26,0.90) 100%)',
            boxShadow:
              '0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div className="mb-6 space-y-1">
            <h1 className="text-center text-[1.65rem] font-semibold tracking-tight text-white">
              Join Vibez Citizens
            </h1>
            <p className="text-center text-sm text-[#9ca3af]">
              Create your account to get started.
            </p>
          </div>

          {successMessage ? (
            <div
              className="mb-4 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2 text-sm text-[#a7f3d0]"
              role="status"
              aria-live="polite"
            >
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div
              className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="text-xs font-medium tracking-wide text-[#d1d5db]">
                Email
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
              <label htmlFor="register-password" className="text-xs font-medium tracking-wide text-[#d1d5db]">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  className={`${inputClass()} pr-10`}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create a secure password"
                  value={form.password}
                  onChange={onInputChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#9ca3af] transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6C4DF6]/50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {!showPasswordRules ? (
                <p className="pt-1 text-xs text-[#9ca3af]">
                  Use at least 8 characters including uppercase, lowercase and a number.
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
              <label htmlFor="register-confirm-password" className="text-xs font-medium tracking-wide text-[#d1d5db]">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  className={`${inputClass()} pr-10`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={onInputChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={onToggleConfirmPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#9ca3af] transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6C4DF6]/50"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {confirmPasswordState.state !== 'idle' ? (
                <div
                  className={[
                    'flex items-center gap-2 pt-1 text-xs transition-colors duration-200',
                    confirmPasswordState.state === 'match' ? 'text-[#22c55e]' : 'text-[#ef4444]',
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            <Link
              to="/login"
              state={navState}
              className="font-medium text-[#c4b5fd] no-underline transition hover:text-[#ddd6fe]"
            >
              Already have an account?
            </Link>

            <button
              type="button"
              onClick={onBackClick}
              className="rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6C4DF6]/50"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
