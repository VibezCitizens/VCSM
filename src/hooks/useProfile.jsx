// src/hooks/useProfile.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function useProfile(userId) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useProfile] Failed to fetch:', error);
      } else {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile };
}
