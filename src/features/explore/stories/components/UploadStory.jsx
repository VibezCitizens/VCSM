import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { uploadToCloudflare } from '@/lib/cloudflareUpload';
import { compressVideo } from '@/utils/compressVideo';

export default function UploadStory({ onUpload }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > 25 * 1024 * 1024) {
      return setError('Max file size is 25MB');
    }
    setFile(selected);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    if (!file) return setError('Select a file');
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      const ext = file.type.startsWith('video') ? 'video' : 'image';
      let uploadFile = file;

      if (ext === 'video') {
        uploadFile = await compressVideo(file);
      }

      const key = `stories/${user.id}/${Date.now()}-${uploadFile.name}`;
      const { url, error: uploadErr } = await uploadToCloudflare(uploadFile, key);
      if (uploadErr) throw new Error(uploadErr);

      const { error: insertErr } = await supabase.from('stories').insert([{
        user_id: user.id,
        media_url: url,
        media_type: ext,
        caption,
      }]);
      if (insertErr) throw new Error(insertErr.message);

      setFile(null);
      setCaption('');
      setSuccess('Story uploaded successfully!');
      if (onUpload) onUpload();
    } catch (err) {
      console.error('[Upload error]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 rounded-xl shadow-xl text-white space-y-4 max-w-md mx-auto mt-4">
      <h2 className="text-lg font-bold">Post a Story</h2>
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
        {loading ? 'Uploading...' : 'Upload Story'}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}
    </div>
  );
}
