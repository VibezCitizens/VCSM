// src/features/settings/screens/SettingsScreen.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivacyTab from '../tabs/PrivacyTab';
import ProfileTab from '../tabs/ProfileTab';
import AccountTab from '../tabs/AccountTab';
import VportsTab from '../tabs/VportsTab';

const TABS = [
  { key: 'privacy', label: 'Privacy' },
  { key: 'profile', label: 'Profile' },
  { key: 'account', label: 'Account' },
  { key: 'vports', label: 'VPORTs' },
];

export default function SettingsScreen() {
  const [tab, setTab] = useState('privacy');
  const nav = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-black text-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-zinc-900">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Settings</h1>
            <button
              onClick={() => nav(-1)}
              className="text-sm text-zinc-400 hover:text-white"
              title="Back"
            >
              Close
            </button>
          </div>

          {/* Segmented tabs */}
          <div
            role="tablist"
            aria-label="Settings tabs"
            className="mt-3 grid grid-cols-4 gap-1 p-1 rounded-xl bg-zinc-900"
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition ${
                    active ? 'bg-white text-black' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="mx-auto max-w-md px-4 py-4 pb-24">
        {tab === 'privacy' && <PrivacyTab />}
        {tab === 'profile' && <ProfileTab />}
        {tab === 'account' && <AccountTab />}
        {tab === 'vports' && <VportsTab />}
      </main>
    </div>
  );
}
