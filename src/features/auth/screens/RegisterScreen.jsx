// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase/supabaseClient'

export default function RegisterScreen() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
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
      // 1) Create auth user
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

      // 2) Create profile shell (NO username, NO display_name)
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: form.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (profileErr) throw profileErr

      // 3) Redirect to onboarding
      navigate('/onboarding', { replace: true })
    } catch (err) {
      console.error('[Register] error', err)
      setErrorMessage(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-4">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border border-purple-700">
        <h1 className="text-2xl font-bold text-center mb-6">
          Join Vibez Citizens
        </h1>

        {successMessage && (
          <div className="bg-green-600 text-white p-3 rounded-md text-center">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-600 text-white p-3 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button
          onClick={handleRegister}
          disabled={!canSubmit}
          className="w-full bg-purple-600 hover:bg-purple-700 transition text-white font-semibold py-3 rounded-xl mt-4 disabled:opacity-50"
        >
          {loading ? 'Registering…' : 'Register'}
        </button>
      </div>
    </div>
  )
}
