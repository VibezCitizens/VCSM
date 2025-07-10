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

  // ✅ Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // Or navigate('/login')
  };

  // ✅ Presence tracking
  useEffect(() => {
    if (!user?.id) return;

    let interval;

    const updatePresence = async () => {
      await supabase.from('profiles').update({
        is_online: true,
        last_seen: new Date().toISOString(),
      }).eq('id', user.id);
    };

    updatePresence();
    interval = setInterval(updatePresence, 30000);

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
      handleUnload();
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
