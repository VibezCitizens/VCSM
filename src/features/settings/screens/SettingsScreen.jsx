// src/features/settings/screens/SettingsScreen.jsx

import { useAuth } from '@/hooks/useAuth';

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
      >
        Log Out
      </button>
    </div>
  );
}
