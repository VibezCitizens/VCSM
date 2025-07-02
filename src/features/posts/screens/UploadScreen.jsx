import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import getCroppedImg from '@/lib/cropImage';

const R2_PUBLIC = 'https://pub-47d41a9f87d148c9a7a41a636e23cb46.r2.dev';
const UPLOAD_ENDPOINT = 'https://upload-post-media-worker.olivertrest3.workers.dev';

export default function UploadScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // New states
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [postType, setPostType] = useState('photo');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const onCropComplete = (_, croppedPixels) => setCroppedAreaPixels(croppedPixels);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setMediaType(selected.type.startsWith('image/') ? 'image' : '');
    setImagePreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!user || !file || mediaType !== 'image') {
      toast.error('Image required');
      return;
    }

    // 🧠 Daily image post restriction (1 per 24h)
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('media_type', 'image')
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentPosts?.length > 0) {
      const lastPostTime = new Date(recentPosts[0].created_at).getTime();
      const now = Date.now();
      const diffHours = (now - lastPostTime) / (1000 * 60 * 60);
      if (diffHours < 24) {
        toast.error('You can only upload 1 image post every 24 hours.');
        return;
      }
    }

    const croppedBlob = await getCroppedImg(imagePreview, croppedAreaPixels);
    const key = `posts/${user.id}/${Date.now()}-cropped.jpg`;

    const form = new FormData();
    form.append('file', croppedBlob);
    form.append('key', key);

    const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: form });
    if (!res.ok) {
      toast.error('Upload failed');
      return;
    }

    const { url } = await res.json();

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      text: text.trim(),
      media_url: url,
      media_type: 'image',
      tags: tags.trim(),
      visibility,
      post_type: postType,
    });

    if (error) toast.error(error.message);
    else {
      toast.success('Posted!');
      navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4 text-white">Upload a Photo</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 mb-3 text-white"
        placeholder="Write a caption..."
        rows={3}
      />

      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 mb-3 text-white"
        placeholder="Tags (comma separated)"
      />

      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
        className="w-full p-3 rounded bg-neutral-800 mb-3 text-white"
      >
        <option value="public">Public</option>
        <option value="friends">Friends</option>
        <option value="subscribers">Subscribers</option>
        <option value="close_friends">Close Friends</option>
      </select>

      <input type="file" accept="image/*" onChange={handleFileChange} className="mb-3" />

      {imagePreview && (
        <div className="relative w-full aspect-square bg-black mb-3 rounded overflow-hidden">
          <Cropper
            image={imagePreview}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        className="w-full bg-white text-black py-2 rounded font-semibold"
      >
        Post
      </button>
    </div>
  );
}
