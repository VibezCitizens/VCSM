// src/hooks/usePresence.js
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePresence(user) {
  useEffect(() => {
    if (!user?.id) return;

    let interval;

    const updatePresence = async () => {
      await supabase.from('profiles').update({
        is_online: true,
        last_seen: new Date().toISOString(),
      }).eq('id', user.id);
    };

    // Initial ping
    updatePresence();

    // Ping every 30s
    interval = setInterval(updatePresence, 30000);

    // On unload → set is_online false
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
      handleUnload(); // Run once on cleanup
    };
  }, [user?.id]);
} 
