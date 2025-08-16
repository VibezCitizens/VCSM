// src/features/vport/VPortDetail.jsx
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Pencil, Plus, ShieldCheck } from 'lucide-react';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';

import { DEFAULT_VPORT_AVATAR } from './constants';
import Section from './components/Section';
import PostCard from './components/PostCard';
import PostComposer from './components/PostComposer';
import MediaCarousel from './components/MediaCarousel';
import ReviewSection from './components/ReviewSection';

import { useVPortData } from './hooks/useVPortData';
import { usePostReactions } from './hooks/usePostReactions';
import { variantForType } from './config/variants';

function extFrom(file) {
  const n = (file?.name || '').toLowerCase();
  const dot = n.lastIndexOf('.');
  if (dot !== -1) return n.slice(dot + 1);
  if (file?.type?.startsWith('image/')) return 'jpg';
  if (file?.type?.startsWith('video/')) return 'mp4';
  return 'bin';
}
function mediaTypeFrom(file) {
  if (!file) return 'text';
  if (file.type?.startsWith('image/')) return 'image';
  if (file.type?.startsWith('video/')) return 'video';
  return 'text';
}

export default function VPortDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { vState, posts, loadingPosts, postsErr, subCount, reloadPosts } = useVPortData(id);

  // ---- Reactions (hook uses emojis internally) ----
  const {
    countsByPost = {},
    myReactions = {},
    reacting = {},
    toggleReaction,
  } = usePostReactions(
    posts,
    user?.id,
    () => navigate('/login', { replace: false, state: { from: `/vports/${id}` } })
  );

  // Translate hook’s emoji state to PostCard’s like/dislike API
  const mapCountsToLD = (countsObj) => ({
    like: countsObj?.['👍'] || 0,
    dislike: countsObj?.['👎'] || 0,
  });
  const mapMineToLD = (emoji) =>
    emoji === '👍' ? 'like' : emoji === '👎' ? 'dislike' : undefined;

  const [composerOpen, setComposerOpen] = React.useState(false);
  const [postErr, setPostErr] = React.useState(null);
  const [posting, setPosting] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState('POST');

  const canEdit = Boolean(user?.id) && vState.v && user.id === vState.v.created_by;

  async function handlePublish({ title, body, file }) {
    setPostErr(null);
    if (!user?.id) {
      navigate('/login', { replace: false, state: { from: `/vports/${id}` } });
      return;
    }
    if (!title && !body && !file) {
      setPostErr('Add a title, body, or media.');
      return;
    }

    setPosting(true);
    try {
      let media_url = null;
      let media_type = 'text';

      if (file) {
        const ext = extFrom(file);
        const key = `vports/${id}/posts/${user.id}_${Date.now()}.${ext}`;
        const { url, error } = await uploadToCloudflare(file, key);
        if (error) throw new Error(error);
        media_url = url;
        media_type = mediaTypeFrom(file);
      }

      const { error: insErr } = await window.supabase
        .from('vport_posts')
        .insert({
          vport_id: id,
          created_by: user.id,
          title: title || null,
          body: body || null,
          media_url,
          media_type,
        });
      if (insErr) throw insErr;

      setComposerOpen(false);
      await reloadPosts();
      setActiveTab('POST');
    } catch (err) {
      setPostErr(err.message || 'Failed to publish post.');
    } finally {
      setPosting(false);
    }
  }

  if (vState.loading) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3 opacity-90">
          <span className="animate-spin border-2 border-zinc-700 rounded-full w-4 h-4 inline-block" />
          <span>Loading VPort…</span>
        </div>
      </div>
    );
  }
  if (vState.error) {
    return (
      <div className="min-h-[100dvh] bg-black text-white p-6">
        <div className="bg-red-600/10 border border-red-600/30 text-red-300 rounded-2xl p-4">
          {vState.error}
        </div>
      </div>
    );
  }
  if (!vState.v) {
    return (
      <div className="min-h-[100dvh] bg-black text-white p-6 text-center">
        <h1 className="text-2xl font-semibold">VPort not found</h1>
        <Link
          to="/vports"
          className="inline-block rounded-xl px-4 py-2 bg-white text-black hover:opacity-90 mt-4"
        >
          Browse VPorts
        </Link>
      </div>
    );
  }

  const v = vState.v;
  const variant = variantForType(v.type); // <- type-aware layout
  const TABS = variant.tabs;

  const bannerStyle = v.banner_url
    ? {
        backgroundImage: `url(${v.banner_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};

  const textPosts = posts.filter(
    (p) =>
      p.media_type === 'text' ||
      (!p.media_url && (!p.media_type || p.media_type === 'text'))
  );
  const photoPosts = posts.filter((p) => p.media_type === 'image');
  const videoPosts = posts.filter((p) => p.media_type === 'video');

  return (
    <div className="min-h-[100dvh] bg-black text-white">
      {/* Banner */}
      <div
        className="h-40 md:h-56 w-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900"
        style={bannerStyle}
      />

      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 -mt-10">
        <div className="flex items-end gap-4">
          <img
            src={v.avatar_url || DEFAULT_VPORT_AVATAR}
            alt={v.name || 'VPort'}
            className="w-24 h-24 rounded-2xl border-4 border-black object-cover bg-zinc-900"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">
                {v.name || 'Untitled VPort'}
              </h1>
              {v.verified && (
                <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                  <ShieldCheck size={16} /> Verified
                </span>
              )}
            </div>
            <div className="text-zinc-400 text-sm">{v.type}</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg px-3 py-1.5 bg-zinc-800 text-zinc-200 text-sm">
              Subscribers • {subCount}
            </div>

            {canEdit && (
              <>
                <button
                  onClick={() => setComposerOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white text-black hover:opacity-90 transition text-sm"
                >
                  <Plus size={16} /> {composerOpen ? 'Close' : 'Post here'}
                </button>
                <Link
                  to={`/vports/${v.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-zinc-800 text-white hover:bg-zinc-700 transition text-sm"
                >
                  <Pencil size={16} /> Edit
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex gap-8 border-b border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2 text-xs tracking-widest uppercase ${
                activeTab === t
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        {/* Left */}
        <div className="md:col-span-2 space-y-6">
          {/* Composer */}
          {composerOpen && canEdit && (
            <Section title="New Post">
              <PostComposer
                posting={posting}
                postErr={postErr}
                onPublish={handlePublish}
              />
            </Section>
          )}

          {/* TABBED CONTENT */}
          {activeTab === 'POST' && (
            <Section title="Posts">
              {loadingPosts ? (
                <div className="text-zinc-400 text-sm">Loading posts…</div>
              ) : postsErr ? (
                <div className="text-red-400 text-sm">{postsErr}</div>
              ) : textPosts.length === 0 ? (
                <div className="text-zinc-400 text-sm">No posts yet.</div>
              ) : (
                <div className="space-y-4">
                  {textPosts.map((p) => {
                    // Map emoji counts to like/dislike shape for PostCard
                    const countsEmoji = countsByPost?.[p.id] || {};
                    const r = {
                      like: countsEmoji['👍'] || 0,
                      dislike: countsEmoji['👎'] || 0,
                    };
                    const mineEmoji = myReactions?.[p.id];
                    const mine = mineEmoji === '👍' ? 'like' : mineEmoji === '👎' ? 'dislike' : undefined;

                    return (
                      <PostCard
                        key={p.id}
                        post={p}
                        r={r}
                        mine={mine}
                        reacting={Boolean(reacting?.[p.id])}
                        // Translate PostCard's 'like'/'dislike' to emoji for the hook
                        onReact={(kind) => toggleReaction(p.id, kind === 'like' ? '👍' : '👎')}
                      />
                    );
                  })}
                </div>
              )}
            </Section>
          )}

          {activeTab === 'PHOTOS' && (
            <Section title="Photos">
              {loadingPosts ? (
                <div className="text-zinc-400 text-sm">Loading…</div>
              ) : photoPosts.length === 0 ? (
                <div className="text-zinc-400 text-sm">No photos yet.</div>
              ) : (
                <MediaCarousel
                  items={photoPosts}
                  itemWidth={320}
                  itemHeight={320}
                  renderItem={(p) => (
                    <img
                      src={p.media_url}
                      alt=""
                      className="rounded-lg w-full h-full object-cover"
                    />
                  )}
                />
              )}
            </Section>
          )}

          {activeTab === 'VIDEOS' && (
            <Section title="Videos">
              {loadingPosts ? (
                <div className="text-zinc-400 text-sm">Loading…</div>
              ) : videoPosts.length === 0 ? (
                <div className="text-zinc-400 text-sm">No videos yet.</div>
              ) : (
                <MediaCarousel
                  items={videoPosts}
                  itemWidth={360}
                  itemHeight={220}
                  renderItem={(p) => (
                    <video
                      src={p.media_url}
                      controls
                      className="rounded-lg w-full h-full object-cover"
                    />
                  )}
                />
              )}
            </Section>
          )}

          {/* Reviews (only for business-like types) */}
          {variant.showReviews && <ReviewSection vportId={id} user={user} />}
        </div>

        {/* Right */}
        <div className="space-y-6">
          {variant.showAbout !== false && (
            <Section title="About">
              <p className="whitespace-pre-wrap text-zinc-200">
                {v.description || 'No description provided yet.'}
              </p>
            </Section>
          )}

          {variant.showContact && (
            <Section title="Contact">
              <div className="space-y-2 text-sm">
                {v.phone && (
                  <div>
                    <span className="text-zinc-400">Phone:</span>{' '}
                    <a href={`tel:${v.phone}`} className="hover:underline">
                      {v.phone}
                    </a>
                  </div>
                )}
                {v.website && (
                  <div>
                    <span className="text-zinc-400">Website:</span>{' '}
                    <a
                      href={v.website}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {v.website}
                    </a>
                  </div>
                )}
                {!v.phone && !v.website && (
                  <div className="text-zinc-400">No contact info yet.</div>
                )}
              </div>
            </Section>
          )}

          {variant.showLocation && (
            <Section title="Location">
              <div className="text-sm space-y-2">
                {v.address && <div>{v.address}</div>}
                {(v.city || v.region || v.country) && (
                  <div>{[v.city, v.region, v.country].filter(Boolean).join(', ')}</div>
                )}
                {!v.address && !v.city && !v.region && !v.country && (
                  <div className="text-zinc-400">No address provided.</div>
                )}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
