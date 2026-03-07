// RegisterScreen.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '@/features/auth/hooks/useRegister'

export default function RegisterScreen() {
  const navigate = useNavigate()
  const { form, loading, errorMessage, successMessage, navState, canSubmit, handleChange, handleRegister } =
    useRegister()

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-4">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-5 border border-purple-700/60">
        <h1 className="text-2xl font-semibold text-center tracking-wide">Join Vibez Citizens</h1>

        {successMessage && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 text-black"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />

        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 text-black"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />

        <button
          onClick={() => {
            void handleRegister()
          }}
          disabled={!canSubmit}
          className="
            w-full
            bg-gradient-to-r from-purple-600 to-violet-600
            hover:from-purple-500 hover:to-violet-500
            transition
            text-white font-semibold
            py-3 rounded-xl
            disabled:opacity-40
          "
        >
          {loading ? 'Registering…' : 'Create account'}
        </button>

        <div className="flex items-center justify-between pt-2 text-sm">
          <Link
            to="/login"
            state={navState}
            className="text-purple-400 font-medium hover:text-purple-300 transition no-underline"
          >
            Already have an account?
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
