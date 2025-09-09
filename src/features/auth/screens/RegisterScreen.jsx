import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const App = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    email: '',
    password: '',
    birthdate: '',
    sex: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const isFormValid =
    form.display_name !== '' &&
    form.username !== '' &&      // user can still type a base; we’ll append the number
    form.email !== '' &&
    form.password !== '' &&
    form.birthdate !== '' &&
    form.sex !== '';

  const handleRegister = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { email, password, ...profileData } = form;

      if (!isFormValid) {
        setErrorMessage('Please fill in all required fields.');
        setLoading(false);
        return;
      }

      // 1) Sign up
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      if (!authData || !authData.user) {
        setSuccessMessage('Registration initiated. Please check your email for a confirmation link.');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // 2) Compute adult flag
      const birthYear = new Date(form.birthdate).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      const isAdult = age >= 18;

      // 3) ★ Generate username with a unique enrollment number (server-side)
      const { data: genUname, error: genErr } = await supabase.rpc('generate_username', {
        _display_name: profileData.display_name,
        _username: profileData.username, // user-typed base; RPC will sanitize and append number
      });
      if (genErr) throw genErr;
      const finalUsername = genUname; // e.g., "john-doe1001"

      // 4) Upsert profile (now with auto-numbered username)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        display_name: profileData.display_name,
        username: finalUsername,       // ★ use the generated username
        birthdate: profileData.birthdate,
        age,
        sex: profileData.sex,
        is_adult: isAdult,
        photo_url: '/avatar.jpg',
        bio: '',
        private: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email,                         // optional: keep your email in profiles
      });
      if (profileError) throw profileError;

      setSuccessMessage('Registration successful! Redirecting to feed...');
      navigate('/');

    } catch (err) {
      console.error('[Registration Error]', err);
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-4 font-inter">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border border-purple-700">
        <h1 className="text-2xl font-bold text-center mb-6">Join Vibez Citizens</h1>

        {successMessage && (
          <div className="bg-green-200 text-white p-3 rounded-md text-center">
            {successMessage}
          </div>
        )}

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
          name="username"
          placeholder="Username (base, number auto-added)"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-zinc-500"
          type="date"
          name="birthdate"
          placeholder="Birthdate"
          value={form.birthdate}
          onChange={handleChange}
          required
        />

        <select
          className="w-full px-4 py-2 rounded-lg bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-400"
          name="sex"
          value={form.sex}
          onChange={handleChange}
          required
        >
          <option value="">Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <button
          onClick={handleRegister}
          disabled={loading || !isFormValid}
          className="w-full bg-purple-600 hover:bg-purple-700 transition text-white font-semibold py-3 rounded-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-sm text-center text-zinc-400 mt-4">
          Already have an account?{' '}
          <a href="/login" className="underline text-purple-300 hover:text-purple-400">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default App;
