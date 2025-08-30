import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      setError(null);
      // Fetch all profiles except the current user's
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, display_name, photo_url')
        .neq('id', currentUser?.id); // Exclude current user from list

      if (fetchError) {
        console.error('Error fetching profiles:', fetchError.message);
        setError('Failed to load other users.');
      } else {
        setProfiles(data || []);
      }
      setLoadingProfiles(false);
    };

    if (currentUser) {
      fetchProfiles();
    }
  }, [currentUser]);

  const handleStartChat = async (targetUserId) => {
    if (!currentUser?.id) {
      alert('You must be logged in to start a chat.');
      return;
    }

    // Get or create conversation ID
    const convoId = await getOrCreatePrivateConversation(currentUser.id, targetUserId);

    if (convoId) {
      navigate(`/chat/${convoId}`);
    } else {
      alert('Failed to start or find conversation.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth'); // Redirect to auth page after logout
  };

  if (authLoading) {
    return <div className="flex flex-col h-full justify-center items-center text-gray-400">Loading user session...</div>;
  }

  if (!currentUser) {
    return <div className="flex flex-col h-full justify-center items-center text-gray-400">Please log in to view the dashboard.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <header className="flex justify-between items-center p-4 bg-white shadow-sm mb-4 rounded-lg">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {currentUser.profile?.display_name || currentUser.email}!</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </header>

      <div className="flex-1 bg-white p-6 rounded-lg shadow-md overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Start a New Conversation:</h2>
        {loadingProfiles ? (
          <p className="text-center text-gray-400">Loading users...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : profiles.length === 0 ? (
          <p className="text-center text-gray-400">No other users found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center p-3 border rounded-lg shadow-sm bg-gray-50">
                <img
                  src={profile.photo_url || '/avatar.jpg'}
                  alt={profile.display_name || 'User'}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <span className="font-medium text-gray-800">{profile.display_name || 'Unnamed User'}</span>
                <button
                  onClick={() => handleStartChat(profile.id)}
                  className="ml-auto bg-blue-500 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-600"
                >
                  Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}