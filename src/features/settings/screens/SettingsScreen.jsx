import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Logout failed');
      return;
    }
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="p-4 text-white min-h-screen bg-neutral-900">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <div className="bg-neutral-800 rounded-xl p-4 space-y-4 shadow-md">
        <div className="text-sm text-gray-400">Account</div>

        <button
          onClick={handleLogout}
          className="w-full text-left text-red-400 font-medium py-2 px-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition-all"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
