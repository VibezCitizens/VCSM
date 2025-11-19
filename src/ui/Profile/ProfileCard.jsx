// src/ui/Profile/ProfileCard.jsx

import React from 'react';
import MessageButton from '@/ui/Profile/Messagebutton';
import SubscribeButton from '@/ui/Profile/Subscribebutton';
import GlobalMoreMenu from '@/ui/Profile/GlobalMoreMenu';

export default function ProfileCard({
  avatarUrl = "/avatar.jpg",
  displayName = "Display Name",
  bio = "",
  subscriberCount = 0,
  mutualFriends = [],
  statusMessage = "",
  coverImage = null,

  isVport = false,
  badgeText = "VPORT",
  badgeColor = "bg-purple-600",
  badgeTextColor = "text-white",

  shape = "rounded-xl",
  cardColor = "bg-neutral-900",
  textColor = "text-white",

  onMessage,
  onSubscribe,
  isSubscribed = false,

  onBlock = () => {},
  onReport = () => {},
  onBlockAndReport = () => {},
}) {
  return (
    <div
      className={`relative w-full ${cardColor} ${textColor} rounded-2xl p-4 shadow-lg border border-neutral-800`}
    >
      {/* THREE DOT MENU */}
      <div className="absolute top-3 right-3 z-20">
        <GlobalMoreMenu
          onBlock={onBlock}
          onReport={onReport}
          onBlockAndReport={onBlockAndReport}
        />
      </div>

      {/* COVER IMAGE */}
      {coverImage && (
        <div className="w-full h-28 rounded-xl overflow-hidden mb-3">
          <img
            src={coverImage}
            alt="cover"
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* TOP ROW */}
      <div className="flex items-center gap-4">
        {/* AVATAR + BADGE */}
        <div className="relative w-20 h-20">
          <img
            src={avatarUrl}
            alt={displayName}
            className={`w-20 h-20 object-cover border border-neutral-700 ${shape}`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/avatar.jpg";
            }}
          />

          {isVport && (
            <div
              className={`
                absolute bottom-0 left-1/2 -translate-x-1/2 
                px-2 py-[2px] rounded-md text-[10px] font-bold 
                ${badgeColor} ${badgeTextColor} shadow-md
              `}
            >
              {badgeText}
            </div>
          )}
        </div>

        {/* RIGHT SIDE CONTENT */}
        <div className="flex flex-col flex-1">
          <span className="text-xl font-semibold">{displayName}</span>

          <span className="text-sm text-neutral-400 mt-1">
            {subscriberCount} Subscribers
          </span>

          {statusMessage && (
            <span className="text-xs text-purple-400 mt-1 italic">
              {statusMessage}
            </span>
          )}

          <div className="flex items-center gap-3 mt-3">
            <MessageButton label="Message" onClick={onMessage} />
            <SubscribeButton
              isSubscribed={isSubscribed}
              onClick={onSubscribe}
            />
          </div>
        </div>
      </div>

      {/* BIO */}
      {bio && (
        <p className="text-sm text-neutral-300 mt-4 whitespace-pre-line">
          {bio}
        </p>
      )}

      {/* MUTUAL FRIENDS */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-col items-end">
          <div className="flex -space-x-2">
            {mutualFriends.slice(0, 3).map((f, idx) => (
              <img
                key={idx}
                src={f.avatarUrl}
                alt="mutual"
                className="w-7 h-7 rounded-full border border-neutral-700 object-cover"
                loading="lazy"
              />
            ))}
          </div>
          <span className="text-xs text-neutral-400 mt-1">Mutual Friends</span>
        </div>
      </div>
    </div>
  );
}
