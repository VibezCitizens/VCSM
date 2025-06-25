import { useRef } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const R2_PUBLIC = 'https://pub-47d41a9f87d148c9a7a41a636.r2.dev';
const UPLOAD_ENDPOINT = 'https://upload-profile-worker.olivertrest3.workers.dev';

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
  onPhotoChange,
  onToggleQR,
  qrOpen = false,
  onEdit,
}) {
  const fileRef = useRef();

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      const key = `profile-pictures/${profile.id}/${Date.now()}-${file.name}`;
      const form = new FormData();
      form.append('file', compressed);
      form.append('key', key);

      const res = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) throw new Error('Upload failed');
      const photoUrl = `${R2_PUBLIC}/${key}`;

      const { error } = await supabase
        .from('profiles')
        .update({ photo_url: photoUrl })
        .eq('id', profile.id);

      if (error) throw new Error('Failed to update profile');

      toast.success('Photo updated');
      onPhotoChange?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-gradient-to-b from-neutral-900 to-black text-center p-4 rounded-b-3xl shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="relative group">
          <img
            src={profile.photo_url || '/default-avatar.png'}
            alt="avatar"
            className="w-36 h-24 rounded-xl object-cover border border-neutral-700 shadow-sm"
          />
          {isOwnProfile && (
            <>
              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                onChange={handlePhotoChange}
                hidden
              />
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="absolute inset-0 w-full h-full bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition"
              >
                Change
              </button>
            </>
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold">{profile.display_name || 'Unnamed'}</h1>
          <p className="text-sm text-gray-400 mt-1">{profile.bio || 'No bio yet.'}</p>
        </div>

        {isOwnProfile && (
          <div className="flex flex-col items-center mt-2 gap-1">
            <button
              onClick={onToggleQR}
              className="text-xs text-purple-300 hover:text-purple-400"
            >
              {qrOpen ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            <button
              onClick={onEdit}
              className="text-xs text-purple-300 hover:text-purple-400"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
