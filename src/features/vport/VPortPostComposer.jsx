import React, { useRef, useState } from 'react';
import { createVPortPost } from './VPortPostService';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';

export default function VPortPostComposer({ vportId, onPosted }) {
  const [body, setBody] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  function onPick() {
    fileRef.current?.click();
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] || null;
    e.target.value = '';
    setFile(f);
  }

  function mediaTypeFromFile(f) {
    if (!f) return 'text';
    if (f.type.startsWith('image/')) return 'image';
    if (f.type.startsWith('video/')) return 'video';
    return 'text';
  }

  async function handlePost() {
    if (!body && !file) {
      setErr('Write something or attach a file.');
      return;
    }
    setErr('');
    setUploading(true);
    try {
      let media_url = null;
      const media_type = mediaTypeFromFile(file);

      if (file) {
        const extGuess = (file.name.split('.').pop() || '').toLowerCase();
        const safeExt = extGuess || (media_type === 'image' ? 'jpg' : media_type === 'video' ? 'mp4' : 'bin');
        const key = `vport_posts/${vportId}/${Date.now()}.${safeExt}`;
        const { url, error } = await uploadToCloudflare(file, key);
        if (error) throw new Error(error);
        media_url = url;
      }

      await createVPortPost(vportId, { body, media_url, media_type });
      setBody('');
      setFile(null);
      onPosted?.();
    } catch (e) {
      setErr(e.message || 'Failed to post.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 p-3 space-y-2 text-white">
      <textarea
        className="w-full p-3 rounded-lg bg-white text-black border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        rows={3}
        placeholder="Share an update…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {file ? (
        <div className="text-xs opacity-80 flex items-center gap-2">
          <span>Attachment:</span>
          <span className="truncate max-w-[60%]">{file.name}</span>
          <button className="text-red-400 underline" onClick={() => setFile(null)} type="button">
            remove
          </button>
        </div>
      ) : null}
      {err && <div className="text-xs text-red-400">{err}</div>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" className="px-3 py-1.5 rounded-lg bg-white text-black border border-gray-300 hover:bg-gray-50 text-sm transition" onClick={onPick} disabled={uploading}>
            Attach
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFileChange} />
        </div>

        <button type="button" className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 transition" onClick={handlePost} disabled={uploading}>
          {uploading ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}
