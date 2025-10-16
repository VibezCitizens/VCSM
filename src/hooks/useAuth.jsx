// src/hooks/useAuth.jsx
import { useEffect, useState, useContext, createContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePresence } from '@/features/chat/hooks/usePresence';

const AuthContext = createContext({ user: null, session: null, loading: true, logout: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // stays true until initial hydration completes

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      try {
        // 1) Hydrate from localStorage (if persisted)
        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
          setLoading(false);
        }

        // 2) Listen for future auth changes (login/logout/refresh)
        const { data: listener } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
          if (!cancelled) {
            setSession(nextSession ?? null);
            setUser(nextSession?.user ?? null);
            setLoading(false);
          }
        });

        unsubscribe = () => listener?.subscription?.unsubscribe?.();
      } catch (e) {
        console.error('[Auth] init error:', e);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Optional presence heartbeat
  usePresence(user);

  const logout = async () => {
    await supabase.auth.signOut();
    // keep it simple for now
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
