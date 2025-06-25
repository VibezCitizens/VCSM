import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const R2_PUBLIC = 'https://pub-47d41a9f87d148c9a7a41a636.r2.dev';
const UPLOAD_ENDPOINT = 'https://upload-post-media-worker.olivertrest3.workers.dev';

export default function UploadScreen() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [canPostImage, setCanPostImage] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        checkImagePostLimit(data.user.id);
      }
    });
  }, []);

  const checkImagePostLimit = async (userId) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('media_type', ['image', 'text+image'])
      .gte('created_at', since);
    setCanPostImage((count ?? 0) === 0);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setFile(selected);
    if (!selected) return;
    const type = selected.type.startsWith('video/')
      ? 'video'
      : selected.type.startsWith('image/')
      ? 'image'
      : '';
    setMediaType(type);
  };

  const uploadToCloudflare = async (file, key) => {
    const compressed = mediaType === 'image'
      ? await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true })
      : file;

    const form = new FormData();
    form.append('file', compressed);
    form.append('key', key);

    const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    return `${R2_PUBLIC}/${key}`;
  };

  const handlePost = async () => {
    if (!user) return;

    if (!text && !file) {
      toast.error('Add text, image, or video');
      return;
    }

    if (!canPostImage && mediaType !== 'video') {
      toast.error('You can only post an image once every 24 hours');
      return;
    }

    let media_url = null;
    let type = 'text';

    if (file && mediaType) {
      const key = `posts/${user.id}/${Date.now()}-${file.name}`;
      try {
        media_url = await uploadToCloudflare(file, key);
        type = mediaType;
      } catch (err) {
        toast.error('Upload failed');
        return;
      }
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      text: text.trim(),
      media_url,
      media_type: type,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Posted successfully');
      navigate('/');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Create a Post</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 mb-3 resize-none"
        placeholder="Write something..."
        rows={4}
      />

      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="mb-3"
      />

      {!canPostImage && mediaType !== 'video' && (
        <p className="text-yellow-500 text-sm mb-2">
          You already posted an image in the past 24 hours.
        </p>
      )}

      <button
        onClick={handlePost}
        className="w-full bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded font-semibold"
      >
        Post
      </button>
    </div>
  );
}
