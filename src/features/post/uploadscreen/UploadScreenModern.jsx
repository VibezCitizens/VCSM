// src/features/post/uploadscreen/UploadScreenModern.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { compressImageFile } from '@/lib/Imagecompressor/compressImage';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';

// ✅ actor helpers
import { getActor, onActorChange, getActiveVportId } from '@/lib/actors/actor';
import vc from '@/lib/vcClient';

/* -------------------------------------------------------------
   Helpers
-------------------------------------------------------------- */
function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#([a-zA-Z0-9_-]{1,64})/g) || [];
  return [...new Set(matches.map((m) => m.toLowerCase().slice(1)))];
}

const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

function classifyFile(file) {
  if (!file) return null;
  if (ACCEPTED_IMAGE.includes(file.type)) return 'image';
  if (ACCEPTED_VIDEO.includes(file.type)) return 'video';
  return 'unknown';
}

/* -------------------------------------------------------------
   Small UI bits
-------------------------------------------------------------- */
const SegBtn = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full font-semibold transition ${
      active ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
    }`}
  >
    {children}
  </button>
);

function MediaPreview({ url, type }) {
  if (!url) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-neutral-700">
      {type === 'video' ? (
        <video src={url} controls playsInline className="w-full h-auto" />
      ) : (
        <img src={url} alt="preview" className="w-full h-auto object-contain" />
      )}
    </div>
  );
}

function TagChips({ tags, onRemove }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700 text-sm"
        >
          #{t}
          <button
            type="button"
            className="opacity-70 hover:opacity-100"
            aria-label={`remove ${t}`}
            onClick={() => onRemove(t)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

/* ---------- “Posting as …” pill ---------- */
function ActorPill({ actor, vportMeta }) {
  const isV = actor?.kind === 'vport';
  const label = isV ? (vportMeta?.name || 'VPORT') : 'My Profile';
  const avatar = isV ? (vportMeta?.avatar_url || '/avatar.jpg') : '/avatar.jpg';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800">
      <img src={avatar} alt="" className="w-5 h-5 rounded-md object-cover border border-neutral-700/70" />
      <span className="text-xs text-white/80">
        Posting as <span className="font-semibold text-white">{label}</span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------
   Upload logic
   (ownerKey is the namespace: active VPORT id OR user id)
-------------------------------------------------------------- */
async function doUpload(fileObj, ownerKey) {
  let uploadFile = fileObj;

  if (fileObj.type.startsWith('image/')) {
    try {
      uploadFile = await compressImageFile(fileObj, 1080, 0.8);
    } catch (err) {
      console.warn('Image compression failed, uploading original:', err);
    }
  }

  const timestamp = Date.now();
  const safeName = fileObj.name.replace(/[^a-z0-9.\-_]/gi, '_');
  const namespace = ownerKey || 'unknown';
  const key = `posts/${namespace}/${timestamp}-${safeName}`;

  const { url, error } = await uploadToCloudflare(uploadFile, key);
  if (error) throw new Error(error);
  return url;
}

/* -------------------------------------------------------------
   Main Component
-------------------------------------------------------------- */
export default function UploadScreenModern({ onCreatePost }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const initialMode = (params.get('mode') || 'post').toLowerCase();
  const [mode, setMode] = useState(['post', '24drop', 'vdrop'].includes(initialMode) ? initialMode : 'post');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [mediaType, setMediaType] = useState(null);
  const [progress, setProgress] = useState(0);
  const [visibility, setVisibility] = useState('public');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // 🔸 actor pill state
  const [actor, setActor] = useState(getActor());          // { kind: 'profile' } | { kind: 'vport', id }
  const [vportMeta, setVportMeta] = useState(null);        // { id, name, avatar_url, slug? }

  // keep actor in sync with global switch
  useEffect(() => {
    const unsub = onActorChange(async (a) => {
      setActor(a);
    });
    return () => { try { unsub?.(); } catch {} };
  }, []);

  // fetch vport name/avatar when in vport mode
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (actor?.kind !== 'vport' || !actor?.id) {
        setVportMeta(null);
        return;
      }
      try {
        const { data, error } = await vc
          .from('vports')
          .select('id, name, avatar_url, slug')
          .eq('id', actor.id)
          .maybeSingle();
        if (!cancelled) setVportMeta(error ? null : data || null);
      } catch {
        if (!cancelled) setVportMeta(null);
      }
    })();
    return () => { cancelled = true; };
  }, [actor]);

  const tags = useMemo(() => extractHashtags(caption), [caption]);

  const removeTag = (tag) => {
    setCaption((c) =>
      c
        .replace(new RegExp(`(\\s|^)#${tag}(?=\\s|$|[.,!?:;])`, 'gi'), '$1')
        .replace(new RegExp(`(\\s|^)${tag}(?=\\s|$|[.,!?:;])`, 'gi'), '$1')
        .replace(/\s{2,}/g, ' ')
        .trim()
    );
  };

  const onPickClick = () => inputRef.current?.click();

  const onFileChosen = (f) => {
    setError('');
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError('File too large (max 50MB).');
      return;
    }
    const kind = classifyFile(f);
    if (kind === 'unknown') {
      setError('Unsupported file type.');
      return;
    }
    setFile(f);
    setMediaType(kind);
    setFileUrl(URL.createObjectURL(f));
  };

  const onDrop = (e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer?.files?.[0]; if (f) onFileChosen(f); };
  const onDrag = (e) => { e.preventDefault(); e.stopPropagation(); };

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      let finalType = 'text';
      let finalUrl = '';

      const activeVportId = getActiveVportId();
      const ownerKey = activeVportId || user?.id || null;

      if (file && ownerKey) {
        finalType = mediaType;
        setProgress(10);
        finalUrl = await doUpload(file, ownerKey);
        setProgress(100);
      }

      const payload = {
        caption: (caption || '').trim(),
        tags,
        visibility,
        media_url: finalUrl || '',
        media_type: finalType,
        mode,
        created_at: new Date().toISOString(),
      };

      if (typeof onCreatePost === 'function') {
        await onCreatePost(payload);
      } else {
        console.log('UploadScreenModern payload:', payload);
      }

      navigate(-1);
    } catch (e) {
      setError(e?.message || 'Failed to publish');
    } finally {
      setSubmitting(false);
      setTimeout(() => setProgress(0), 600);
    }
  }

  function disabledReason() {
    if (submitting) return 'Submitting...';
    if (!caption.trim() && !file) return 'Add text or media';
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-xl mx-auto">
      {/* 🔹 Centered header: posting-as pill + mode pills */}
      <div className="flex flex-col items-center gap-3 mb-4">
        <ActorPill actor={actor} vportMeta={vportMeta} />

        <div className="flex flex-wrap justify-center gap-2">
          <SegBtn active={mode === 'post'} onClick={() => setMode('post')}>POST</SegBtn>
          <SegBtn active={mode === '24drop'} onClick={() => setMode('24drop')}>24DROP</SegBtn>
          <SegBtn active={mode === 'vdrop'} onClick={() => setMode('vdrop')}>VDROP</SegBtn>
        </div>
      </div>

      {/* Picker */}
      <div
        className="rounded-xl border border-dashed border-neutral-600 p-6 text-center bg-neutral-900 hover:bg-neutral-800 transition cursor-pointer"
        onClick={onPickClick}
        onDrop={onDrop}
        onDragOver={onDrag}
        onDragEnter={onDrag}
      >
        <input
          ref={inputRef}
          type="file"
          accept={[...ACCEPTED_IMAGE, ...ACCEPTED_VIDEO].join(',')}
          className="hidden"
          onChange={(e) => onFileChosen(e.target.files?.[0])}
        />
        <div className="text-neutral-300">Click to upload or drag & drop</div>
        <div className="text-xs text-neutral-500 mt-1">
          Images (JPG/PNG/WebP/GIF) or Video (MP4/WebM/MOV) up to 50MB
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4">
        <MediaPreview url={fileUrl} type={mediaType} />
      </div>

      {/* Caption */}
      <div className="mt-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="Write a caption… (use #hashtags)"
          className="w-full px-4 py-3 rounded-xl bg-neutral-900 text-white border border-neutral-700 focus:outline-none"
        />
        <TagChips tags={tags} onRemove={removeTag} />
      </div>

      {/* Visibility */}
      <div className="mt-4">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="w-full px-4 py-2 rounded-xl bg-neutral-900 text-white border border-neutral-700 focus:outline-none"
        >
          <option value="public">Public</option>
          <option value="followers">Followers</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* Error + Progress */}
      {error ? <div className="mt-3 text-red-400 text-sm">{error}</div> : null}
      {progress > 0 && progress < 100 ? (
        <div className="mt-3 h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-2 bg-purple-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {/* Submit */}
      <div className="mt-6">
        <button
          type="button"
          disabled={!!disabledReason()}
          onClick={handleSubmit}
          className={[
            'w-full px-4 py-3 rounded-xl font-semibold transition',
            disabledReason()
              ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white',
          ].join(' ')}
        >
          {disabledReason() || (mode === 'post' ? 'Post' : mode === '24drop' ? 'Post to 24DROP' : 'Post to VDROP')}
        </button>
      </div>
    </div>
  );
}