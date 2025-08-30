// src/features/chat/hooks/useRealtimeWhileVisible.js
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useRealtimeWhileVisible({ channelKey, onInsert, enabled = true, filter }) {
  const chRef = useRef(null);

  const stop = useCallback(() => {
    if (chRef.current) {
      supabase.removeChannel(chRef.current);
      chRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!enabled || document.hidden || chRef.current) return;
    const ch = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter },
        ({ new: row }) => onInsert?.(row)
      )
      .subscribe();
    chRef.current = ch;
  }, [enabled, channelKey, filter, onInsert]);

  useEffect(() => {
    if (!enabled) return;

    // start immediately if visible
    start();

    const onVis = () => (document.hidden ? stop() : start());
    const onFocus = () => start();
    const onBlur = () => stop();
    const onOnline = () => { stop(); start(); };
    const onOffline = () => stop();

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      stop(); // cleanup on route unmount
    };
  }, [enabled, start, stop]);
}
