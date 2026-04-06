// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

// src/features/auth/screens/Onboarding.jsx
import '@/features/auth/styles/registerFormCard.css'

import { useAuthOnboarding } from '@/features/auth/hooks/useAuthOnboarding'

function inputClass() {
  return [
    'auth-register-input w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white',
    'placeholder:text-[#9ca3af] outline-none transition duration-200',
    'focus:border-[#6C4DF6]/80 focus:ring-2 focus:ring-[#6C4DF6]/40',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  ].join(' ')
}

function selectClass() {
  return `${inputClass()} auth-register-select`
}

export default function Onboarding() {
  const {
    form,
    loading,
    saving,
    errorMessage,
    isValid,
    todayISO,
    handleChange,
    handleSave,
  } = useAuthOnboarding()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse text-zinc-300">
          Preparing onboarding...
        </div>
      </div>
    )
  }

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
              Complete Your Profile
            </h1>
            <p className="text-center text-sm text-[#9ca3af]">
              Finish setup to continue into Vibez Citizens.
            </p>
          </div>

          {errorMessage ? (
            <div
              className="mb-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSave()
            }}
            noValidate
          >
            <div className="space-y-1.5">
              <label htmlFor="onboarding-display-name" className="text-xs font-medium tracking-wide text-[#d1d5db]">
                Name
              </label>
              <input
                id="onboarding-display-name"
                className={inputClass()}
                name="display_name"
                placeholder="Name shown on your profile"
                value={form.display_name}
                onChange={handleChange}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="onboarding-username-base" className="text-xs font-medium tracking-wide text-[#d1d5db]">
                Username
              </label>
              <input
                id="onboarding-username-base"
                className={inputClass()}
                name="username_base"
                placeholder="Username base"
                value={form.username_base}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="onboarding-birthdate" className="text-xs font-medium tracking-wide text-[#d1d5db]">
                Birthdate
              </label>
              <input
                id="onboarding-birthdate"
                className={inputClass()}
                type="date"
                name="birthdate"
                value={form.birthdate}
                onChange={handleChange}
                max={todayISO}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="onboarding-sex" className="text-xs font-medium tracking-wide text-[#d1d5db]">
                Sex
              </label>
              <select
                id="onboarding-sex"
                className={selectClass()}
                name="sex"
                value={form.sex}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select sex
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!isValid || saving}
              className={[
                'mt-1 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200',
                isValid && !saving
                  ? 'bg-[#6C4DF6] shadow-[0_10px_30px_rgba(108,77,246,0.35)] hover:-translate-y-[1px] hover:bg-[#7657ff] active:translate-y-0'
                  : 'cursor-not-allowed bg-white/10 text-white/60 shadow-none',
              ].join(' ')}
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[#9ca3af]">
            We sanitize your username and append digits if needed.
          </p>
        </div>
      </div>
    </div>
  )
}
