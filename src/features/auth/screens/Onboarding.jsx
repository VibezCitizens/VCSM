// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

// src/features/auth/screens/Onboarding.jsx
import { useAuthOnboarding } from '@/features/auth/hooks/useAuthOnboarding'

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
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-4 font-inter">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border border-purple-700">
        <h1 className="text-2xl font-bold text-center mb-6">
          Complete Your Profile
        </h1>

        {errorMessage && (
          <div className="bg-red-600 text-white p-3 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        <div className="relative">
          <input
            className="w-full px-4 py-2 rounded-lg bg-zinc-200 relative z-10"
            name="profile_display_name"
            placeholder="Name shown on your profile"
            value={form.display_name}
            onChange={handleChange}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            required
          />

          {form.display_name && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 select-none">
              <span className="opacity-0">{form.display_name}</span>
              <span className="ml-1">your name</span>
            </span>
          )}
        </div>

        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200"
          name="username_base"
          placeholder="Username (base - we'll make it unique)"
          value={form.username_base}
          onChange={handleChange}
          required
        />

        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200"
          type="date"
          name="birthdate"
          value={form.birthdate}
          onChange={handleChange}
          max={todayISO}
          required
        />

        <select
          className="w-full px-4 py-2 rounded-lg bg-zinc-200"
          name="sex"
          value={form.sex}
          onChange={handleChange}
        >
          <option value="">Sex (optional)</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>

        <p className="text-xs text-center text-zinc-400">
          We'll sanitize your username and add a number if needed.
        </p>
      </div>
    </div>
  )
}
