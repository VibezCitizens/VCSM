import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';

import Avatar from '@/features/settings/components/Avatar';
import Card from '@/features/settings/components/Card';
import Row from '@/features/settings/components/Row';
import SwitchIdentityModal from '@/features/settings/components/SwitchIdentityModal';

import useMyVports from '@/features/settings/hooks/useMyVports';

export default function SettingsScreen() {
  // ---- hooks (fixed order) ----
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { identity, actAsUser, actAsVport } = useIdentity();
  const [openSwitch, setOpenSwitch] = useState(false);
  const { vports, refresh } = useMyVports();

  // ---- derived values (no hooks below) ----
  const username =
    user?.username ||
    user?.user_metadata?.username ||
    user?.display_name ||
    user?.email ||
    'Account';

  const avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url || null;

  const accountLeft = useMemo(() => (
    <>
      <Avatar url={avatarUrl} name={username} />
      <div className="min-w-0">
        <div className="truncate font-medium">{username}</div>
        {identity?.type === 'vport' ? (
          <div className="text-xs text-violet-300">Acting as VPORT</div>
        ) : (
          <div className="text-xs text-zinc-400">Personal</div>
        )}
      </div>
    </>
  ), [avatarUrl, username, identity?.type]);

  const userEntry = {
    id: user?.id,
    email: user?.email ?? '',
    display: username,
    avatar_url: avatarUrl ?? '',
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white overflow-y-auto">
      <div className="mx-auto w-full max-w-xl px-4 pt-6 pb-28 space-y-6">
        <div className="text-center text-sm text-zinc-400 font-medium">Vibez Citizens</div>

        {/* NAVIGATION */}
        <div className="space-y-3">
          <Link to="/vgrid" className="block w-full text-center rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700 transition-colors">
            Open Map
          </Link>
          <Link to="/vports" className="block w-full text-center rounded-xl bg-violet-600 py-3 font-semibold hover:bg-violet-700 transition-colors">
            Open VPorts
          </Link>
        </div>

        {/* ACCOUNT (opens modal) */}
        <Card title="ACCOUNT">
          <Row onClick={() => setOpenSwitch(true)} left={accountLeft} />
        </Card>

        {/* PRIVACY & SECURITY */}
        <Card title="PRIVACY & SECURITY">
          <Row to="/settings/privacy" left={<div className="font-medium">Privacy &amp; Security</div>} />
          <div className="mx-3 h-px bg-zinc-800/70" />
          <Row to="/settings/notifications" left={<div className="font-medium">Notifications</div>} />
        </Card>

        {/* SETTINGS */}
        <Card title="SETTINGS">
          <Row to="/settings/account-settings" left={<div className="font-medium">Account Settings</div>} />
        </Card>

        {/* SESSION */}
        <div className="pt-2 text-xs tracking-wide text-zinc-400">SESSION</div>
        <button
          onClick={logout}
          className="w-full rounded-xl bg-red-600 py-3 font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M16 13v-2H7V8l-5 4 5 4v-3h9Z" />
            <path d="M20 3h-8a2 2 0 0 0-2 2v3h2V5h8v14h-8v-3h-2v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z" />
          </svg>
          Log Out
        </button>
      </div>

      {/* Switch / Create Modal */}
      <SwitchIdentityModal
        open={openSwitch}
        onClose={() => setOpenSwitch(false)}
        userEntry={userEntry}
        vports={vports}
        currentIdentity={identity}
        user={user}
        onActAsUser={() => {
          actAsUser();
          setOpenSwitch(false);
        }}
        onActAsVport={(vp) => {
          actAsVport(vp.id);
          setOpenSwitch(false);
        }}
        onCreated={async (vp) => {
          await refresh();
          actAsVport(vp.id);
          setOpenSwitch(false);
          navigate(`/vport/${vp.id}`);
        }}
      />
    </div>
  );
}
