import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import ResetPasswordScreen from '@/features/auth/screens/ResetPasswordScreen';

import CentralFeed from '@/features/feed/screens/CentralFeed';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import UploadScreen from '@/features/posts/screens/UploadScreen';

import Layout from '@/components/Layout';
import ChatRoutes from '@/features/chat/ChatRoutes';

export default function App() {
  const { user, loading } = useAuth();

  // ✅ Real-time user presence tracking
  useEffect(() => {
    if (!user?.id) return;

    // Set initial presence
    supabase.from('user_presence').upsert({
      user_id: user.id,
      is_typing: false,
      last_seen_at: new Date().toISOString(),
    });

    // Subscribe to live presence updates
    const channel = supabase
      .channel('presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        (payload) => {
          // You could add global state or logs here
          console.log('Presence update:', payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading) return <div className="text-center text-white">Loading...</div>;

  return (
    <Routes>
      {/* Public: Auth Screens */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/reset" element={<ResetPasswordScreen />} />

      {/* Protected Routes */}
      {user ? (
        <>
          <Route
            path="/"
            element={
              <Layout>
                <CentralFeed />
              </Layout>
            }
          />
          <Route
            path="/me"
            element={
              <Layout title={false}>
                <ProfileScreen />
              </Layout>
            }
          />
          <Route
            path="/u/:username"
            element={
              <Layout>
                <ProfileScreen />
              </Layout>
            }
          />
          <Route
            path="/upload"
            element={
              <Layout title="New Post">
                <UploadScreen />
              </Layout>
            }
          />
          <Route
            path="/chat/*"
            element={
              <Layout>
                <ChatRoutes />
              </Layout>
            }
          />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
