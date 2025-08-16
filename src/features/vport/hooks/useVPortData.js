import React from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useVPortData(id) {
  const [vState, setVState] = React.useState({ loading: true, error: null, v: null });

  const [posts, setPosts] = React.useState([]);
  const [loadingPosts, setLoadingPosts] = React.useState(true);
  const [postsErr, setPostsErr] = React.useState('');

  const [subCount, setSubCount] = React.useState(0);

  // load vport
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('vports')
          .select(`
            id, name, type, description,
            phone, website, address, city, region, country,
            verified, claim_status, created_by, created_at, updated_at,
            avatar_url, banner_url
          `)
          .eq('id', id)
          .single();
        if (error) throw error;
        if (mounted) setVState({ loading: false, error: null, v: data });
      } catch (err) {
        if (mounted) setVState({ loading: false, error: err.message || 'Failed to load VPort', v: null });
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const reloadPosts = React.useCallback(async () => {
    try {
      setLoadingPosts(true);
      setPostsErr('');
      const { data, error } = await supabase
        .from('vport_posts')
        .select('id, title, body, media_url, media_type, created_at')
        .eq('vport_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      setPostsErr(e.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [id]);

  React.useEffect(() => { reloadPosts(); }, [reloadPosts]);

  // subscribers count
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { count, error } = await supabase
          .from('vport_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('vport_id', id);
        if (!mounted) return;
        if (error) throw error;
        setSubCount(count || 0);
      } catch {
        setSubCount(0);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  return { vState, posts, loadingPosts, postsErr, subCount, reloadPosts };
}
