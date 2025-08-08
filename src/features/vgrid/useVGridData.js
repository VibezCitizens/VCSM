import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function useVGridData() {
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Get logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPorts([]);
      setLoading(false);
      return;
    }

    // Fetch only VGrid spots created by this user
    const { data, error } = await supabase
      .from('vgrid_spots')
      .select('id, name, latitude, longitude, type, verified')
      .eq('created_by', user.id) // <-- requires created_by column
      .order('created_at', { ascending: false });

    if (error) {
      setError(error);
    } else {
      setPorts(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ports, loading, error, refresh: fetchData };
}
