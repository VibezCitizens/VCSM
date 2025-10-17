// src/features/auth/screens/LoginScreen.jsx
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // --- NEW: one-time discoverable flip after successful login
  const markDiscoverableIfNeeded = async (authUserId) => {
    if (!authUserId) return;

    // 1) Quick read to avoid unnecessary updates
    const { data: profile, error: readErr } = await supabase
      .from('profiles')
      .select('id, discoverable')
      .eq('id', authUserId)
      .single();

    if (readErr || !profile) return; // silently skip on read issues

    if (profile.discoverable === false) {
      // 2) One-time update guarded by WHERE discoverable=false
      await supabase
        .from('profiles')
        .update({ discoverable: true, updated_at: new Date().toISOString() })
        .eq('id', authUserId)
        .eq('discoverable', false);
    }
  };
  // --- END NEW

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const pwd = password.trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: pwd,
      });

      console.log('[Login] result', data, error);
      if (error) throw error;

      // NEW: flip discoverable only if currently false (one-time)
      const authUserId = data?.user?.id;
      await markDiscoverableIfNeeded(authUserId);

      const from = location.state?.from?.pathname;
      const dest =
        from && !['/login', '/register', '/reset', '/forgot-password'].includes(from)
          ? from
          : '/feed';

      navigate(dest, { replace: true });
    } catch (err) {
      setError(err?.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && email.trim() && password.trim();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 bg-neutral-900 p-6 sm:p-8 rounded-2xl shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-center">Vibez Citizens</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          className="w-full px-4 py-2 bg-neutral-800 text-white placeholder:text-neutral-400 border border-neutral-700 rounded-lg focus:outline-none focus:border-purple-500 transition-all duration-150 text-[18px]"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-4 py-2 bg-neutral-800 text-white placeholder:text-neutral-400 border border-neutral-700 rounded-lg focus:outline-none focus:border-purple-500 transition-all duration-150 text-[18px]"
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-all duration-150 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="mt-2 text-center text-sm text-neutral-400">
          <Link to="/forgot-password" className="text-purple-400 hover:underline">
            Forgot password?
          </Link>
        </p>

        <p className="text-sm text-center text-neutral-400">
          Don’t have an account?{' '}
          <Link to="/register" className="text-purple-400 hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginScreen;
