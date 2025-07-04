import { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabaseClient';

const R2_PUBLIC = 'https://cdn.vibezcitizens.com';
const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
  onPhotoChange,
  onToggleQR,
  qrOpen = false,
  onEdit,
}) {
  const fileRef = useRef();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [subscriberModalOpen, setSubscriberModalOpen] = useState(false);
  const [subscribers, setSubscribers] = useState([]);

  // --- NEW: Derive photo upload disabled state based on profile.id validity ---
  // This helps disable the UI element if the profile ID is not yet ready.
  // Assuming profile.id should be a UUID string. Adjust regex if your IDs differ.
  const isProfileIdValid = profile?.id && typeof profile.id === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(profile.id);
  // --- END NEW ---

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];

    // --- MODIFIED: Stricter validation at the start of the handler ---
    if (!file) {
      // If no file was selected (e.g., user opened then cancelled dialog), just return.
      return;
    }

    if (!isProfileIdValid) { // Use the derived state here
      toast.error('Profile not fully loaded or ID is invalid. Cannot upload photo.');
      // It's important to clear the file input so the user can try again
      // after the profile loads correctly.
      e.target.value = '';
      return; // Stop function execution if ID is invalid
    }
    // --- END MODIFIED ---

    setIsUploadingPhoto(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      // The 'key' will now reliably contain a valid profile ID
      const key = `profile-pictures/${profile.id}.jpg`;
      const form = new FormData();
      form.append('file', compressed);
      form.append('key', key); // Your Cloudflare Worker uses this 'key'

      const res = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown upload error' }));
        throw new Error(errorData.message || 'Upload failed with status: ' + res.status);
      }

      const photoUrl = `${R2_PUBLIC}/${key}`; // This URL now correctly points to the R2 object

      const { error } = await supabase
        .from('profiles')
        .update({ photo_url: photoUrl })
        .eq('id', profile.id); // This query now uses a valid profile.id

      if (error) throw new Error(error.message);

      toast.success('Photo updated!');
      onPhotoChange?.();
    } catch (err) {
      console.error("Profile photo upload error:", err);
      toast.error(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const loadSubscribers = async () => {
    if (!profile?.id) {
      toast.error('Profile ID is missing.');
      return;
    }

    const { data, error } = await supabase
      .from('followers')
      .select('follower_id, profiles!follower_id(*)')
      .eq('followed_id', profile.id);

    if (error) {
      console.error("Error loading subscribers:", error);
      toast.error('Failed to load subscribers.');
      return;
    }

    const cleanSubscribers = (data || [])
      .map((d) => d.profiles)
      .filter(Boolean)
      .sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));

    setSubscribers(cleanSubscribers);
    setSubscriberModalOpen(true);
  };

  return (
    <>
      <div className="bg-neutral-900 rounded-xl mx-4 mt-6 p-5 flex items-center justify-between shadow-md min-h-[140px]">
        {/* LEFT: Info */}
        <div className="flex flex-col justify-center space-y-1 text-left max-w-[70%]">
          <h1 className="text-xl font-semibold leading-tight">
            {profile.display_name || 'Unnamed'}
          </h1>
          <p className="text-sm text-gray-400 leading-snug">
            {profile.bio || 'No bio yet.'}
          </p>

          {/* Subscriber Count Display */}
          {typeof profile.subscriber_count === 'number' ? (
            profile.subscriber_count > 0 ? (
              isOwnProfile ? (
                <button
                  onClick={loadSubscribers}
                  className="text-sm text-purple-400 hover:underline text-left"
                >
                  {profile.subscriber_count} Subscriber{profile.subscriber_count !== 1 && 's'}
                </button>
              ) : (
                <p className="text-sm text-purple-400">
                  {profile.subscriber_count} Subscriber{profile.subscriber_count !== 1 && 's'}
                </p>
              )
            ) : (
              <p className="text-sm text-purple-400">0 Subscribers</p>
            )
          ) : (
            <p className="text-sm text-purple-400">Subscribers loading...</p>
          )}

          {/* Own Profile Actions (Show QR, Edit Profile) */}
          {isOwnProfile && (
            <div className="flex gap-4 mt-1">
              <button onClick={onToggleQR} className="text-xs text-purple-400 hover:underline">
                {qrOpen ? 'Hide QR Code' : 'Show QR Code'}
              </button>
              <button onClick={onEdit} className="text-xs text-purple-400 hover:underline">
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Avatar */}
        <div className="relative group w-24 h-24 shrink-0 ml-4">
          <img
            src={profile.photo_url || '/default-avatar.png'}
            alt={profile.display_name || 'User profile picture'}
            className="w-full h-full object-cover rounded-xl border border-neutral-700 shadow-sm"
          />
          {isOwnProfile && (
            <>
              {/* Hidden file input for photo upload */}
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileRef}
                onChange={handlePhotoUpload}
                // --- MODIFIED: Disable if profile ID is not valid ---
                disabled={isUploadingPhoto || !isProfileIdValid}
                // --- END MODIFIED ---
              />
              {/* Overlay button to change photo */}
              <button
                type="button"
                // --- MODIFIED: Prevent click if profile ID is not valid ---
                onClick={() => !isUploadingPhoto && isProfileIdValid && fileRef.current?.click()}
                className={`absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs rounded-xl transition ${
                  // --- MODIFIED: Apply disabled styling if profile ID is not valid ---
                  isUploadingPhoto || !isProfileIdValid ? 'opacity-100 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'
                }`}
                // --- MODIFIED: Disable button if profile ID is not valid ---
                disabled={isUploadingPhoto || !isProfileIdValid}
                // --- END MODIFIED ---
              >
                {isUploadingPhoto ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Change'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* SUBSCRIBER MODAL */}
      {subscriberModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSubscriberModalOpen(false)}
        >
          <div
            className="bg-neutral-900 rounded-lg p-5 w-full max-w-sm max-h-[70vh] overflow-y-auto text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Your Subscribers</h2>
              <button
                onClick={() => setSubscriberModalOpen(false)}
                className="text-sm text-purple-400 hover:underline"
              >
                Close
              </button>
            </div>
            {subscribers.length > 0 ? (
              <ul className="space-y-3">
                {subscribers.map((user) => (
                  <li key={user.id} className="flex items-center gap-3">
                    <img
                      src={user.photo_url || '/default-avatar.png'}
                      alt={user.display_name || 'Subscriber avatar'}
                      className="w-8 h-8 rounded-lg object-cover border border-neutral-700"
                    />
                    <div>
                      <p className="text-sm font-medium">{user.display_name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-400">No subscribers found.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}