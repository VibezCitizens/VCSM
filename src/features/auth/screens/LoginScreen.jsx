﻿import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

import { getActiveSeasonTheme } from '@/Season';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Load season (with hat position + hatClassMap from theme)
  const season = getActiveSeasonTheme("topRight");

  const markDiscoverableIfNeeded = async (authUserId) => {
    if (!authUserId) return;

    const { data: profile, error: readErr } = await supabase
      .from('profiles')
      .select('id, discoverable')
      .eq('id', authUserId)
      .single();

    if (readErr || !profile) return;

    if (!profile.discoverable) {
      await supabase
        .from('profiles')
        .update({ discoverable: true, updated_at: new Date().toISOString() })
        .eq('id', authUserId);
    }
  };

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

      if (error) throw error;

      await markDiscoverableIfNeeded(data?.user?.id);

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
    <div className={season.wrapper}>
      
      {season.fog1 && <div className={season.fog1} />}
      {season.fog2 && <div className={season.fog2} />}

      <div className="w-full max-w-md mx-auto">
        <div className="relative">

          {/* 🎅 Santa Hat */}
          {season.hatPosition && season.hatClassMap && (
            <img
              src="/season/xmas/XmasHat.png"
              alt="Xmas Hat"
              className={`w-72 pointer-events-none z-50 ${season.hatClassMap[season.hatPosition]}`}
            />
          )}

          <form
            onSubmit={handleLogin}
            className="
              relative
              w-full space-y-5 
              bg-white/5 backdrop-blur-xl
              border border-white/10
              p-6 sm:p-8 rounded-2xl 
              shadow-[0_8px_32px_rgba(0,0,0,0.6)]
            "
          >
            <h1 className="text-5xl font-['GFS Didot'] text-center tracking-[0.5px] leading-tight">
              Vibez Citizens
            </h1>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              className="w-full px-4 py-2 bg-black/30 text-white placeholder:text-neutral-300 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-all duration-150 text-[18px]"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 bg-black/30 text-white placeholder:text-neutral-300 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 transition-all duration-150 text-[18px]"
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="
                w-full py-2 
                bg-purple-600/80 hover:bg-purple-600
                rounded-lg 
                transition-all duration-150 
                disabled:opacity-50
              "
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="text-center text-sm text-neutral-300">
              <Link to="/forgot-password" className="text-purple-400 hover:underline">
                Forgot password?
              </Link>
            </p>

            <p className="text-sm text-center text-neutral-300">
              Don’t have an account?{' '}
              <Link to="/register" className="text-purple-400 hover:underline">
                Register here
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;