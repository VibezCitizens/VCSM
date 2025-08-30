// src/features/explore/vdrop/VDropScreen.jsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import VDropCard from './VDropCard';
import { Volume2, VolumeX } from 'lucide-react';

export default function VDropScreen() {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef(null);

  // fetch latest user + vport videos
  useEffect(() => {
    (async () => {
      const userReq = supabase
        .from('posts')
        .select(`
          id, title, text, media_url, media_type, post_type, created_at, user_id,
          profiles ( id, display_name, username, photo_url )
        `)
        .or('post_type.eq.video,media_type.eq.video')
        .eq('deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      const vportReq = supabase
        .from('vport_posts')
        .select(`
          id, title, body, media_url, media_type, created_at, vport_id,
          vport:vport_id ( id, name, avatar_url )
        `)
        .eq('media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(50);

      const [userRes, vportRes] = await Promise.all([userReq, vportReq]);
      if (userRes.error) console.error('User video fetch error:', userRes.error);
      if (vportRes.error) console.error('VPORT video fetch error:', vportRes.error);

      const users = (userRes.data || []).map(r => ({
        id: r.id,
        media_url: r.media_url,
        title: r.title ?? r.text ?? '',
        created_at: r.created_at,
        source: 'posts',
        author_user: r.profiles ?? null,
      }));

      const vports = (vportRes.data || []).map(r => ({
        id: r.id,
        media_url: r.media_url,
        title: r.title ?? r.body ?? '',
        created_at: r.created_at,
        source: 'vport_posts',
        author_vport: r.vport ?? null,
      }));

      setVideos([...users, ...vports].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ));
    })();
  }, []);

  // track which full-screen card is centered
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const vh = window.innerHeight || el.clientHeight || 1;
        const idx = Math.round(el.scrollTop / vh);
        const clamped = Math.max(0, Math.min(idx, Math.max(0, videos.length - 1)));
        setCurrentIndex(clamped);
        ticking = false;
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [videos.length]);

  // lock body scroll while the feed is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // pause video when tab/app goes to background (mobile friendly)
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        try {
          const playing = containerRef.current?.querySelector('video');
          playing?.pause();
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // respect reduced motion a bit (start muted)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq?.matches) setIsMuted(true);
  }, []);

  // simple virtualization: render only current ±1
  const isNear = (i) => Math.abs(i - currentIndex) <= 1;

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory bg-black z-50
                 overscroll-contain touch-pan-y"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Vertical video feed"
    >
      {/* Global mute toggle (kept clear of notches) */}
      <div
        className="fixed right-3 z-[100]"
        style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <button
          onClick={() => setIsMuted(p => !p)}
          className="bg-black/60 p-1.5 rounded-full text-white"
          aria-label={isMuted ? 'Unmute videos' : 'Mute videos'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {videos.map((video, i) => (
        <div key={`${video.source}:${video.id}`} className="h-[100dvh] snap-start">
          {isNear(i) && (
            <VDropCard
              video={video}
              isActive={i === currentIndex}
              muted={isMuted}
            />
          )}
        </div>
      ))}
    </div>
  );
}
