import React from "react";
import MessageButton from "@/ui/Profile/Messagebutton";

export default function ProfileHeaderCard({
  // data
  displayName,
  bio,
  photoUrl,
  bannerUrl,
  isVport,
  subscriberCount,
  // flags
  isOwnProfile = false,
  isBlocked = false,
  allowBannerUpload = false,
  // callbacks
  onChangeAvatar,
  onChangeBanner,
  onShowQr,
  onShowSubscribers,
  onBlockToggle,
  onMessage,
  // extra render slots
  dotsMenu,
  actions, // message + subscribe stack
}) {
  const onBannerError = (e) => {
    if (e?.target?.src !== "/default-banner.jpg") {
      e.target.src = "/default-banner.jpg";
    }
  };

  const onAvatarError = (e) => {
    if (e?.target?.src !== "/avatar.jpg") {
      e.target.src = "/avatar.jpg";
    }
  };

  return (
    <div className="w-full text-white">
      {/* Banner */}
      <div className="relative w-full h-44 md:h-60">
        <img
          src={bannerUrl || "/default-banner.jpg"}
          alt="Profile banner"
          className="absolute inset-0 w-full h-full object-cover"
          onError={onBannerError}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

        {isOwnProfile && allowBannerUpload && (
          <button
            type="button"
            onClick={onChangeBanner}
            className="absolute top-3 right-3 rounded-xl px-3 py-1 text-xs bg-black/40 hover:bg-black/60 backdrop-blur-sm"
          >
            Change Banner
          </button>
        )}
      </div>

      {/* Header card */}
      <div className="relative">
        <div className="mx-auto max-w-5xl px-4">
          <div className="-mt-14 md:-mt-16 relative z-10">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-5 md:p-6 shadow-lg">
              <div className="flex items-start gap-4 md:gap-6">
                {/* Avatar */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                  <img
                    src={photoUrl || "/avatar.jpg"}
                    alt="avatar"
                    className="w-full h-full object-cover rounded-2xl border border-neutral-700 shadow"
                    onError={onAvatarError}
                  />
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={onChangeAvatar}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-xs opacity-0 hover:opacity-100 transition-opacity"
                    >
                      Change
                    </button>
                  )}
                </div>

                {/* Info + actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-xl md:text-2xl font-semibold truncate">
                        {displayName || "Unnamed"}
                      </h1>
                      <p className="mt-1 text-sm text-neutral-300 line-clamp-3">
                        {bio || "No bio yet."}
                      </p>

                      {!isVport && typeof subscriberCount === "number" && (
                        <button
                          onClick={onShowSubscribers}
                          className="mt-2 text-sm text-purple-400 hover:underline"
                        >
                          {subscriberCount} Subscriber
                          {subscriberCount !== 1 ? "s" : ""}
                        </button>
                      )}
                    </div>

                    {/* QR (own profile) */}
                    {isOwnProfile && (
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={onShowQr}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm text-white"
                        >
                          Show QR
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions stack, right-aligned */}
                  {!isOwnProfile && !isBlocked && actions && (
                    <div className="mt-4 flex justify-end">
                      <div className="flex flex-col items-end gap-2">{actions}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Three-dots menu slot */}
              {dotsMenu && (
                <div className="absolute top-4 right-4 z-50">{dotsMenu}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
