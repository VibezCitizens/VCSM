// src/features/settings/screens/SettingsScreen.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Map tab/button */}
      <Link
        to="/vgrid"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
      >
        Open Map
      </Link>

      {/* Log out */}
      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
      >
        Log Out
      </button>
    </div>
  );
}
