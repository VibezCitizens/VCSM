// src/auth/CompleteProfileGate.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default function CompleteProfileGate({ children }) {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, needsOnboarding: false });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        if (isMounted) setState({ loading: false, needsOnboarding: false });
        return;
      }

      // ensure there’s a profile row (id = auth user id)
      let profile = null;
      try {
        profile = await fetchProfile(user.id);
        if (!profile) {
          // create a shell row so onboarding can update in-place
          const { error: upsertErr } = await supabase.from('profiles').upsert({
            id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email: user.email ?? null,
          });
          if (upsertErr) throw upsertErr;
          profile = await fetchProfile(user.id);
        }
      } catch (e) {
        console.error('[Gate] profile fetch/upsert error', e);
      }

      const incomplete =
        !profile ||
        !profile.display_name ||
        profile.display_name.trim() === '' ||
        !profile.username ||
        profile.username.trim() === '';

      if (isMounted) setState({ loading: false, needsOnboarding: incomplete });
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse text-zinc-300">Loading…</div>
      </div>
    );
  }

  if (state.needsOnboarding) {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}
