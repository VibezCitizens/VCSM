// src/features/settings/components/CreateVportInline.jsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MAX_IMAGE_BYTES, TYPE_OPTIONS, UPLOAD_ENDPOINT, cx } from '../constants';

export default function CreateVportInline({ user, onCreated, onCancel }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('business');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const canSubmit = !!(user?.id && name.trim() && type);

  async function uploadAvatar() {
    if (!file) return '';
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', `vports/${user.id}`);
    const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const json = await res.json();
    if (!json?.url) throw new Error('Upload missing URL');
    return json.url;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErr('');

    try {
      // optional avatar upload – failure does not block vport creation
      let avatar_url = '';
      try { avatar_url = await uploadAvatar(); } catch { avatar_url = ''; }

      const normalizedType = String(type).toLowerCase();
      if (!TYPE_OPTIONS.includes(normalizedType)) {
        throw new Error('Invalid Vport type.');
      }

      const { data, error } = await supabase
        .from('vports')
        .insert({
          // Ownership only (no managers):
          created_by: user.id,
          name: name.trim(),
          type: normalizedType,
          avatar_url: avatar_url || null,
          description: (desc || '').trim() || null,
        })
        .select('id, name, avatar_url')
        .single();

      if (error) throw error;

      // No manager trigger anymore — caller should refresh owned vports (created_by = user.id).
      onCreated?.(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg || 'Failed to create Vport.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Create a Vport</div>
        <button type="button" onClick={onCancel} className="text-zinc-400 hover:text-zinc-200">Back</button>
      </div>

      <div>
        <label className="block text-sm text-zinc-200 mb-1.5">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-white border border-zinc-300 text-black placeholder-zinc-500 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-600"
          placeholder="e.g., Joseline’s Trucking"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-200 mb-1.5">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-xl bg-white border border-zinc-300 text-black px-3 py-2 outline-none focus:ring-2 focus:ring-violet-600"
          required
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <div className="text-xs text-zinc-500 mt-1">
          Must be one of: {TYPE_OPTIONS.join(', ')}.
        </div>
      </div>

      <div>
        <label className="block text-sm text-zinc-200 mb-1.5">Avatar</label>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-zinc-200 overflow-hidden flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-zinc-500">
                <path fill="currentColor" d="M12 12a5 5 0 100-10 5 5 0 000 10Zm-7 9a7 7 0 0114 0v1H5v-1Z"/>
              </svg>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (!f.type.startsWith('image/')) {
                setErr('Please choose an image file.'); return;
              }
              if (f.size > MAX_IMAGE_BYTES) {
                setErr(`Image is too large (max ${(MAX_IMAGE_BYTES/1024/1024).toFixed(1)}MB).`); return;
              }
              setErr('');
              setFile(f);
            }}
          />
          <button
            type="button"
            className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            onClick={() => inputRef.current?.click()}
          >
            Choose image
          </button>
          {file ? (
            <button
              type="button"
              className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700"
              onClick={() => setFile(null)}
            >
              Remove
            </button>
          ) : null}
        </div>
        <div className="text-xs text-zinc-500 mt-1">PNG/JPG up to 5MB.</div>
      </div>

      <div>
        <label className="block text-sm text-zinc-200 mb-1.5">Description (optional)</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          className="w-full rounded-xl bg-white border border-zinc-300 text-black placeholder-zinc-500 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-600"
          placeholder="Tell people what this Vport is about…"
        />
      </div>

      {err ? (
        <div className="rounded-xl bg-red-950 border border-red-900 text-red-200 px-3 py-2 text-sm">{err}</div>
      ) : null}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className={cx(
            'rounded-xl px-4 py-2.5 font-semibold',
            canSubmit && !submitting ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
          )}
        >
          {submitting ? 'Creating…' : 'Create Vport'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl bg-zinc-800 px-4 py-2.5 hover:bg-zinc-700">
          Cancel
        </button>
      </div>
    </form>
  );
}
