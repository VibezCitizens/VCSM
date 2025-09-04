// src/features/explore/stories/components/UploadStory.jsx
import React, { useState } from 'react';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare'; // single source of truth
import { compressVideo } from '@/utils/compressVideo';
import { useIdentity } from '@/state/identityContext';
import { db } from '@/data/data';

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_DURATION_SEC = 15;

/** Infer media type robustly from MIME, then filename. */
function inferMediaType(file) {
  const mime = (file?.type || '').toLowerCase();
  const name = (file?.name || '').toLowerCase();
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  if (/\.(mp4|mov|webm|mkv|m4v)$/i.test(name)) return 'video';
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(name)) return 'image';
  return 'image';
}

/** Read client-side video duration in seconds. */
function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.onloadedmetadata = () => {
        const duration = Number(video.duration) || 0;
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read video metadata.'));
      };
    } catch (e) {
      reject(e);
    }
  });
}

function sanitizeFilename(name, ts) {
  return `${ts}-${(name || `${ts}`)
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')}`;
}

export default function UploadStory({ onUpload }) {
  const { identity } = useIdentity();
  const isActingAsVPort = identity?.type === 'vport' && Boolean(identity?.vportId);
  const vportId = identity?.vportId ?? null;

  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_SIZE_BYTES) {
      setError('Max file size is 25MB.');
      setSuccess('');
      setFile(null);
      return;
    }
    setFile(selected);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Select a file.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = await db.auth.getAuthUser();
      if (!user?.id) throw new Error('You must be logged in.');
      const userId = user.id;

      // 1) Decide media type
      const mediaType = inferMediaType(file); // 'image' | 'video'
      let uploadFile = file;

      // 2) Video duration + optional compress/trim
      if (mediaType === 'video') {
        const duration = await getVideoDuration(file);
        if (duration > MAX_DURATION_SEC + 0.25) {
          // Your current compressVideo signature is (file, onProgress?), so no options object:
          try {
            uploadFile = await compressVideo(file);
          } catch {
            throw new Error('Video must be 15 seconds or shorter.');
          }
        } else {
          // Optional recompress to control bitrate/size; ignore failures
          try {
            uploadFile = await compressVideo(file);
          } catch {
            /* keep original on compression failure */
          }
        }
      }

      // 3) Build storage key + upload to Cloudflare
      const ts = Date.now();
      const key = isActingAsVPort
        ? `vport_stories/${vportId}/${sanitizeFilename(uploadFile.name, ts)}`
        : `stories/${userId}/${sanitizeFilename(uploadFile.name, ts)}`;

      const { url, error: uploadErr } = await uploadToCloudflare(uploadFile, key);
      if (uploadErr) throw new Error(uploadErr);
      if (!url) throw new Error('Upload returned no URL.');

      // 4) Insert via DAL (use the DAL’s expected field names)
      if (isActingAsVPort) {
        await db.stories.createVportStory({
          vportId,
          createdBy: userId,     // matches DAL param
          mediaUrl: url,         // camelCase per DAL
          mediaType,             // camelCase per DAL
          caption: caption ?? '',
        });
        setSuccess('VPORT story uploaded!');
      } else {
        await db.stories.createUserStory({
          userId,
          mediaUrl: url,         // camelCase per DAL
          mediaType,             // camelCase per DAL
          caption: caption ?? '',
        });
        setSuccess('Story uploaded successfully!');
      }

      setFile(null);
      setCaption('');
      onUpload?.();
    } catch (err) {
      console.error('[Upload story error]', err);
      setError(err?.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 rounded-xl shadow-xl text-white space-y-4 max-w-md mx-auto mt-4">
      <h2 className="text-lg font-bold">
        {isActingAsVPort ? 'Post a VPORT Story' : 'Post a Story'}
      </h2>

      <input type="file" accept="image/*,video/*" onChange={handleFile} />

      <input
        type="text"
        className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
        placeholder="Add a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 transition py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Uploading…' : (isActingAsVPort ? 'Upload VPORT Story' : 'Upload Story')}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}
    </div>
  );
}
