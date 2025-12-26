// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

// src/features/auth/screens/Onboarding.jsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase/supabaseClient'

import { createUserActorForProfile }
  from '@/features/auth/controllers/createUserActor.controller'

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/'

  // 🔑 REQUIRED
  const [userId, setUserId] = useState(null)

  const [form, setForm] = useState({
    display_name: '',
    username_base: '',
    birthdate: '',
    sex: '', // 👈 added
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user

      if (!user) {
        navigate('/login', { replace: true })
        return
      }

      setUserId(user.id)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, birthdate')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && profile) {
        setForm(prev => ({
          ...prev,
          // ❌ NEVER hydrate display_name during onboarding
          username_base: profile.username || '',
          birthdate: profile.birthdate || '',
        }))
      }

      if (isMounted) setLoading(false)
    })()

    return () => { isMounted = false }
  }, [navigate])

  const isValid =
    form.display_name.trim() !== '' &&
    form.username_base.trim() !== '' &&
    form.birthdate.trim() !== ''

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'profile_display_name') {
      setForm(prev => ({ ...prev, display_name: value }))
      return
    }

    setForm(prev => ({ ...prev, [name]: value }))
  }

  function computeAge(isoDate) {
    const d = new Date(isoDate)
    if (Number.isNaN(d.getTime())) return null

    const today = new Date()
    let age = today.getFullYear() - d.getFullYear()
    const m = today.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
    return Math.max(age, 0)
  }

  const handleSave = async () => {
    if (!isValid || !userId) return

    setSaving(true)
    setErrorMessage('')

    try {
      // 1️⃣ Generate username
      const { data: genUname, error: genErr } = await supabase.rpc(
        'generate_username',
        {
          _display_name: form.display_name,
          _username: form.username_base,
        }
      )
      if (genErr) throw genErr

      const finalUsername = genUname

      // 2️⃣ Compute age
      const age = computeAge(form.birthdate)
      if (age == null) throw new Error('Invalid birthdate.')

      const isAdult = age >= 18

      // 3️⃣ Save profile (INCLUDING sex)
      const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: userId,
        display_name: form.display_name.trim(),
        username: finalUsername,
        birthdate: form.birthdate,
        age,
        is_adult: isAdult,
        sex: form.sex || null, // ✅ FIX
        updated_at: new Date().toISOString(),
      })

      if (upsertErr) throw upsertErr

      // 4️⃣ Create actor (idempotent)
      await createUserActorForProfile({
        profileId: userId,
        userId,
      })

      navigate(redirectTo, { replace: true })
    } catch (err) {
      console.error('[Onboarding] save error', err)
      setErrorMessage(err.message || 'Failed to complete onboarding.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse text-zinc-300">
          Preparing onboarding…
        </div>
      </div>
    )
  }

  const todayISO = new Date().toISOString().slice(0, 10)

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

        {/* Display name (NO PREFILL EVER) */}
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
          placeholder="Username (base — we’ll make it unique)"
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

        {/* Sex (optional) */}
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
          {saving ? 'Saving…' : 'Save & Continue'}
        </button>

        <p className="text-xs text-center text-zinc-400">
          We’ll sanitize your username and add a number if needed.
        </p>
      </div>
    </div>
  )
}
