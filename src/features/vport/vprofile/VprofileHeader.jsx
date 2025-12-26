// src/features/vport/vprofile/VprofileHeader.jsx
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

import VisibleQRCode from "@/features/profiles/components/qRCode/VisibleQRCode";
import ProfileDots from "@/features/profiles/components/private/ProfileDots";
import { useBlockStatus } from "@/features/profiles/hooks/useBlockStatus";
import VportSocialActions from "./VportSocialActions.jsx";
import { supabase } from '@/services/supabase/supabaseClient'; //transfer; // ✅ named import

const DEFAULT_AVATAR = "/avatar.jpg";
const DEFAULT_BANNER = "/default-banner.jpg";

export default function VprofileHeader({
  profile,
  isOwnProfile = false,
  metricLabel = "Subscribers",
  metricCount,
  initialSubscribed = false,
  onSubscribeToggle,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const p = profile || {};
  const profileId = p.id ?? null; // vc.vports.id
  const profileUsername = p.slug ?? p.username ?? null;

  const profileDisplayName = p.name ?? p.display_name ?? "VPORT";
  const profileBio = p.bio ?? p.description ?? "";
  const profilePhotoUrl =
    p.avatar_url ?? p.photo_url ?? p.avatarUrl ?? DEFAULT_AVATAR;
  const profileBannerUrl =
    p.banner_url ?? p.cover_url ?? p.bannerUrl ?? DEFAULT_BANNER;

  // resolve actorId of this VPORT
  const [actorId, setActorId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!profileId) {
        setActorId(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .schema("vc")
          .from("actors")
          .select("id")
          .eq("vport_id", profileId)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) setActorId(data?.id ?? null);
      } catch {
        if (!cancelled) setActorId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [forcedBlocked, setForcedBlocked] = useState(false);

  useEffect(() => setQrCodeModalOpen(false), [profileId]);
  useEffect(() => setQrCodeModalOpen(false), [location.pathname]);

  // Always check block state using THIS VPORT’S profile id (actor based).
  const targetProfileIdForBlock = profileId;

  const { isBlocking } = useBlockStatus(targetProfileIdForBlock);

  const qrCodeValue = useMemo(() => {
    if (!profileId) return "";
    const base = window.location.origin;
    return `${base}/vport/${profileUsername || profileId}`;
  }, [profileId, profileUsername]);

  if (!profileId) {
    return (
      <div className="w-full text-white">
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          VPort not found. Ensure you’re passing a VPort row (vc.vports) with an{" "}
          <code>id</code>.
        </div>
      </div>
    );
  }

  if (forcedBlocked && !isOwnProfile) return null;

  return (
    <div className="w-full text-white">
      {/* Banner */}
      <div className="relative w-full h-44 md:h-60">
        <img
          src={profileBannerUrl || DEFAULT_BANNER}
          alt="VPORT banner"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_BANNER;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />
      </div>

      {/* Header card */}
      <div className="relative">
        <div className="mx-auto max-w-5xl px-4">
          <div className="-mt-14 md:-mt-16 relative z-10">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-5 md:p-6 shadow-lg relative">
              <div className="flex items-start gap-4 md:gap-6">
                {/* Avatar */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                  <img
                    src={profilePhotoUrl || DEFAULT_AVATAR}
                    alt="avatar"
                    className="w-full h-full object-cover rounded-2xl border border-neutral-700 shadow"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                </div>

                {/* Info + actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-xl md:text-2xl font-semibold truncate">
                        {profileDisplayName || "VPORT"}
                      </h1>
                      <p className="mt-1 text-sm text-neutral-300 line-clamp-3">
                        {profileBio || "No description yet."}
                      </p>

                      {typeof metricCount === "number" && (
                        <div className="mt-2 text-sm text-purple-400">
                          {metricCount} {metricLabel}
                        </div>
                      )}
                    </div>

                    {isOwnProfile && (
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => setQrCodeModalOpen(true)}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm text-white"
                        >
                          Show QR
                        </button>
                      </div>
                    )}
                  </div>

                  {!isOwnProfile && (
                    <div className="mt-2 flex justify-end">
                      <VportSocialActions
                        vportId={profileId}
                        initialSubscribed={initialSubscribed}
                        onSubscribeToggle={onSubscribeToggle}
                      />
                    </div>
                  )}
                </div>
              </div>

              {!isOwnProfile && (
                <div className="absolute top-4 right-4 z-50">
                  <ProfileDots
                    targetId={targetProfileIdForBlock}
                    targetActorId={actorId || null}
                    initialBlocked={isBlocking}
                    onBlock={(nowBlocked) => {
                      if (nowBlocked) {
                        setForcedBlocked(true);
                        navigate("/", {
                          replace: true,
                          state: { justBlocked: profileId },
                        });
                      } else {
                        toast.success("Profile unblocked");
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div className="h-2" />
          </div>
        </div>
      </div>

      {qrCodeModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setQrCodeModalOpen(false)}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/70 select-none">
            Tap anywhere to close
          </div>
          <div className="max-w-[90vw] max-h-[80vh]">
            <VisibleQRCode value={qrCodeValue} />
          </div>
        </div>
      )}
    </div>
  );
}
