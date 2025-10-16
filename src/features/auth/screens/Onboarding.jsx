// src/features/auth/screens/Onboarding.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({
    display_name: '',
    username_base: '',
    birthdate: '',       // ✅ NEW
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }
      setUserId(user.id);

      // Prefill existing values (now includes birthdate)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name, username, birthdate')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && profile) {
        setForm((prev) => ({
          ...prev,
          display_name: profile.display_name || '',
          username_base: profile.username || '',
          birthdate: profile.birthdate || '',
        }));
      }

      if (isMounted) setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const isValid =
    form.display_name.trim() !== '' &&
    form.username_base.trim() !== '' &&
    form.birthdate.trim() !== ''; // ✅ require DOB

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // same age calc as your registration
  function computeAge(isoDate) {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return Math.max(age, 0);
  }

  const handleSave = async () => {
    if (!isValid || !userId) return;
    setSaving(true);
    setErrorMessage('');

    try {
      // 1) Generate unique username from base
      const { data: genUname, error: genErr } = await supabase.rpc('generate_username', {
        _display_name: form.display_name,
        _username: form.username_base,
      });
      if (genErr) throw genErr;
      const finalUsername = genUname;

      // 2) Compute age/adult from birthdate
      const age = computeAge(form.birthdate);
      if (age == null) {
        throw new Error('Invalid birthdate. Please select a valid date.');
      }
      const isAdult = age >= 18;

      // 3) Upsert profile with new data
      const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: userId,
        display_name: form.display_name.trim(),
        username: finalUsername,
        birthdate: form.birthdate, // ✅ save DOB
        age,                       // ✅ keep parity with your register screen
        is_adult: isAdult,         // ✅ keep parity
        updated_at: new Date().toISOString(),
      });
      if (upsertErr) throw upsertErr;

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('[Onboarding] save error', err);
      setErrorMessage(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse text-zinc-300">Preparing onboarding…</div>
      </div>
    );
  }

  const todayISO = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-4 font-inter">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border border-purple-700">
        <h1 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h1>

        {errorMessage && (
          <div className="bg-red-600 text-white p-3 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          name="display_name"
          placeholder="Display Name"
          value={form.display_name}
          onChange={handleChange}
          required
        />

        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          name="username_base"
          placeholder="Username (base — we’ll make it unique)"
          value={form.username_base}
          onChange={handleChange}
          required
        />

        {/* ✅ DOB (required) */}
        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          type="date"
          name="birthdate"
          placeholder="Birthdate"
          value={form.birthdate}
          onChange={handleChange}
          max={todayISO}     // prevent future dates
          required
        />

        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="w-full bg-purple-600 hover:bg-purple-700 transition text-white font-semibold py-3 rounded-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
        >
          {saving ? 'Saving…' : 'Save & Continue'}
        </button>

        <p className="text-xs text-center text-zinc-400">
          We’ll sanitize your username and add a number if needed to make it unique.
        </p>
      </div>
    </div>
  );
}
