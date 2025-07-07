// src/hooks/useSearch.js
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function useSearch(query, tab) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return setResults([]);

    const fetch = async () => {
      setLoading(true);
      let data = [];

      if (tab === 'users') {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, display_name, photo_url')
          .textSearch('display_name', query, { type: 'websearch' });

        data = users || [];
      }

      if (tab === 'posts') {
        const { data: posts } = await supabase
          .from('posts')
          .select('id, content, post_type, created_at')
          .textSearch('content', query, { type: 'websearch' });

        data = posts || [];
      }

      if (tab === 'groups') {
        const { data: groups } = await supabase
          .from('chat_groups') // adjust to your actual table name
          .select('id, name')
          .textSearch('name', query, { type: 'websearch' });

        data = groups || [];
      }

      setResults(data);
      setLoading(false);
    };

    fetch();
  }, [query, tab]);

  return { results, loading };
}
