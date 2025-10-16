import React from 'react';
import SocialActions from '@/components/SocialButtons'; // your unified friend/follow UI

export default function LockedProfileHeader({ preview }) {
  if (!preview) return null;

  const name = preview.display_name || preview.username || 'User';

  return (
    <div className="bg-neutral-900 rounded-xl mx-4 mt-6 p-5 flex items-center justify-between shadow-md min-h-[140px]">
      <div className="flex flex-col justify-center space-y-2 text-left max-w-[70%]">
        <h1 className="text-xl font-semibold text-white">{name}</h1>
        <p className="text-sm text-neutral-400">
          This profile is private.
        </p>

        {/* Friend-first button (menu has follow/block if you kept them) */}
        <div className="mt-2">
          <SocialActions
            targetUserId={preview.id}
            // optional: hide follow/block in the menu for a super minimal view
            // showFollow={false}
            // showBlock={false}
          />
        </div>
      </div>

      <div className="relative w-24 h-24 shrink-0 ml-4">
        <img
          src={preview.photo_url || '/avatar.jpg'}
          alt={name}
          className="w-full h-full object-cover rounded-xl border border-neutral-700"
        />
      </div>
    </div>
  );
}
