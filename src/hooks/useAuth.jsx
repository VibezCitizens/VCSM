// src/hooks/useAuth.jsx
import { useEffect, useState, useContext, createContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePresence } from '@/features/chat/hooks/usePresence';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Init session + listen for auth changes
  useEffect(() => {
    let unsub = () => {};

    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      });

      unsub = () => listener.subscription.unsubscribe();
    })();

    return () => unsub();
  }, []);

  // Presence heartbeat (last_seen only)
  usePresence(user);

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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
