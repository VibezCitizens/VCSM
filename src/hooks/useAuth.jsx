// src/hooks/useAuth.js
import { useEffect, useState, useContext, createContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ✅ Use Presence Tracking (embedded here globally)
  useEffect(() => {
    if (!user?.id) return;

    let interval;

    const updatePresence = async () => {
      await supabase.from('profiles').update({
        is_online: true,
        last_seen: new Date().toISOString(),
      }).eq('id', user.id);
    };

    updatePresence(); // Initial ping
    interval = setInterval(updatePresence, 30000); // Ping every 30 seconds

    const handleUnload = async () => {
      await supabase.from('profiles').update({
        is_online: false,
        last_seen: new Date().toISOString(),
      }).eq('id', user.id);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload(); // Cleanup ping
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
