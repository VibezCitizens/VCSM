// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/services/supabase/supabaseClient'

export default function RegisterScreen() {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const navState = useMemo(() => {
    const s = location?.state || {}
    return {
      from: typeof s.from === 'string' ? s.from : null,
      card: typeof s.card === 'string' ? s.card : null,
      // ✅ only present when coming from WandersShareVCSM (or other intentional caller)
      wandersClientKey: typeof s.wandersClientKey === 'string' ? s.wandersClientKey : null,
    }
  }, [location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errorMessage) setErrorMessage('')
    if (successMessage) setSuccessMessage('')
  }

  const canSubmit =
    form.email.trim() !== '' &&
    form.password.trim() !== '' &&
    !loading

  const handleRegister = async () => {
    if (!canSubmit) return

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data: authData, error: signUpError } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        })

      if (signUpError) throw signUpError

      // Email confirmation flow
      if (!authData?.user) {
        setSuccessMessage(
          'Registration initiated. Please check your email to confirm your account.'
        )
        return
      }

      const userId = authData.user.id

      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: form.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (profileErr) throw profileErr

      // ✅ Claim ONLY when they came from WandersShareVCSM (state includes wandersClientKey)
      if (navState?.wandersClientKey) {
        try {
          await supabase.rpc('claim_guest_mailbox', {
            p_client_key: navState.wandersClientKey,
          })
        } catch (e) {
          console.warn('[Wanders claim] failed', e)
          // fail open: registration should still succeed
        }
      }

      navigate('/onboarding', { replace: true })
    } catch (err) {
      const msg = String(err?.message || 'Registration failed')
      const lower = msg.toLowerCase()

      // ✅ nice case: already registered
      if (
        lower.includes('already registered') ||
        lower.includes('user already registered') ||
        lower.includes('already exists')
      ) {
        setErrorMessage('Already registered. Log in instead.')
        return
      }

      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  const showAlreadyRegistered = errorMessage
    .toLowerCase()
    .includes('already registered')

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-4">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-5 border border-purple-700/60">
        <h1 className="text-2xl font-semibold text-center tracking-wide">
          Join Vibez Citizens
        </h1>

        {successMessage && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2">
            <div className="text-sm text-red-200">{errorMessage}</div>

            {showAlreadyRegistered && (
              <Link
                to="/login"
                state={navState}
                className="
                  shrink-0
                  rounded-lg
                  bg-white/10
                  px-3 py-1.5
                  text-sm font-semibold
                  text-white
                  hover:bg-white/15
                  transition
                  no-underline
                "
              >
                Log in
              </Link>
            )}
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
          onClick={handleRegister}
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
          {loading ? 'Registering…' : 'Register'}
        </button>

        <div className="flex items-center justify-between pt-2 text-sm">
          <Link
            to="/login"
            state={navState}
            className="
              text-purple-400
              font-medium
              hover:text-purple-300
              transition
              no-underline
            "
          >
            Already have an account?
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              px-3 py-1.5
              rounded-lg
              bg-white/5
              border border-white/10
              text-white/80
              hover:bg-white/10
              transition
            "
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
