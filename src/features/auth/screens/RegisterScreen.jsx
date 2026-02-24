// RegisterScreen.jsx
import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/services/supabase/supabaseClient'
import { getWandersSupabase } from '@/features/wanders/services/wandersSupabaseClient'

export default function RegisterScreen() {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const navState = useMemo(() => {
    const s = location?.state || {}
    return {
      from: typeof s.from === 'string' ? s.from : null,
      card: typeof s.card === 'string' ? s.card : null,
      wandersFlow: Boolean(s.wandersFlow),
    }
  }, [location])

  const isWandersFlow = Boolean(location?.state?.wandersFlow)

  const authClient = useMemo(() => {
    return isWandersFlow ? getWandersSupabase() : supabase
  }, [isWandersFlow])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errorMessage) setErrorMessage('')
    if (successMessage) setSuccessMessage('')
  }

  const canSubmit = form.email.trim() !== '' && form.password.trim() !== '' && !loading

  const goOnboarding = () => {
    navigate('/onboarding', {
      replace: true,
      state: {
        from: navState.from,
        card: navState.card,
        wandersFlow: navState.wandersFlow,
      },
    })
  }

  const handleRegister = async () => {
    if (!canSubmit) return

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data: sess } = await authClient.auth.getSession()
      const userId = sess?.session?.user?.id || null

      if (userId) {
        const { error: updErr } = await authClient.auth.updateUser({
          email: form.email,
          password: form.password,
        })
        if (updErr) throw updErr

        const { error: profileErr } = await authClient
          .from('profiles')
          .upsert({
            id: userId,
            email: form.email,
            updated_at: new Date().toISOString(),
          })
        if (profileErr) throw profileErr

        if (isWandersFlow) {
          const { data: sess2, error: sess2Err } = await authClient.auth.getSession()
          if (sess2Err) throw sess2Err

          const s = sess2?.session || null
          if (s?.access_token && s?.refresh_token) {
            const { error: setSessErr } = await supabase.auth.setSession({
              access_token: s.access_token,
              refresh_token: s.refresh_token,
            })
            if (setSessErr) throw setSessErr

            // ✅ force-warm the main client session before routing
            const { error: warmErr } = await supabase.auth.getSession()
            if (warmErr) throw warmErr
          }
        }

        goOnboarding()
        return
      }

      const { data: authData, error: signUpError } = await authClient.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (signUpError) throw signUpError

      if (!authData?.user) {
        setSuccessMessage('Registration initiated. Please check your email to confirm your account.')
        return
      }

      const newUserId = authData.user.id
      const { error: profileErr } = await authClient
        .from('profiles')
        .upsert({
          id: newUserId,
          email: form.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      if (profileErr) throw profileErr

      if (isWandersFlow) {
        const { data: sess3 } = await authClient.auth.getSession()
        const s = sess3?.session || null
        if (s?.access_token && s?.refresh_token) {
          const { error: setSessErr } = await supabase.auth.setSession({
            access_token: s.access_token,
            refresh_token: s.refresh_token,
          })
          if (setSessErr) throw setSessErr

          // ✅ force-warm main session before routing
          const { error: warmErr } = await supabase.auth.getSession()
          if (warmErr) throw warmErr
        }
      }

      goOnboarding()
    } catch (err) {
      const msg = String(err?.message || 'Registration failed')
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

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
