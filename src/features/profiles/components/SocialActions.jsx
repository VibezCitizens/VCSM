import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/state/identityContext";
import SubscribeButton from "@/features/profiles/components/subscriber/SubscribeButton";
import vc from "@/lib/vcClient"; // supabase client scoped to 'vc'

// ===== DEBUG =================================================================
const DEBUG = true;
const dlog = (...a) => DEBUG && console.debug("[SocialActions]", ...a);
// ============================================================================

export default function SocialActions({
  profileId,
  targetActorId,
  isOwnProfile,
  initialSubscribed,
  onSubscribeToggle,
  onFollowToggle,
  profileIsPrivate = false,
  onMessage, // kept for external MessageButton in ProfileHeader
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { identity } = useIdentity();
  const [busy, setBusy] = useState(false);

  const myActorId = useMemo(() => identity?.actorId ?? null, [identity]);
  const isVportPersona = identity?.type === "vport";

  // skip rendering for self-profile
  if (!profileId || !user?.id || isOwnProfile || user.id === profileId) return null;

  // Wait for actor hydration
  useEffect(() => {
    if (!myActorId && identity?.actorId) {
      dlog("Actor became ready:", identity.actorId);
    }
  }, [myActorId, identity]);

  // Resolve target actor (for profile we're viewing)
  const resolveTargetActorId = useCallback(
    async (targetProfileId) => {
      if (targetActorId) return targetActorId;
      const { data, error } = await vc
        .from("actors")
        .select("id")
        .eq("profile_id", targetProfileId)
        .maybeSingle();
      if (error) {
        dlog("resolveTargetActorId error:", error.message);
        return null;
      }
      return data?.id ?? null;
    },
    [targetActorId]
  );

  // Unified follow/subscribe toggle
  const handleToggle = useCallback(
    (now) => {
      if (typeof onSubscribeToggle === "function") onSubscribeToggle(now);
      else if (typeof onFollowToggle === "function") onFollowToggle(now);
    },
    [onSubscribeToggle, onFollowToggle]
  );

  // Open or create direct chat
  const openDirectChat = useCallback(
    async ({ meActorId, otherActorId }) => {
      const { data: convId, error } = await vc.rpc("vc_get_or_create_one_to_one", {
        a1: meActorId,
        a2: otherActorId,
      });
      if (error || !convId) throw new Error(error?.message || "Failed to open chat");
      // Delay ensures React Router navigation doesn’t freeze while state updates
      setTimeout(() => {
        navigate(`${isVportPersona ? "/vport/chat" : "/chat"}/${convId}`);
      }, 150);
    },
    [navigate, isVportPersona]
  );

  // Message handler (safe, debounced, actor-ready)
  const handleMessage = useCallback(async () => {
    if (busy) return; // prevent spam
    if (!myActorId) {
      toast.error("Loading your identity. Please wait...");
      return;
    }

    setBusy(true);
    const dismiss = toast.loading("Opening chat…");

    try {
      if (typeof onMessage === "function") {
        await onMessage();
      } else {
        const otherActorId = await resolveTargetActorId(profileId);
        if (!otherActorId) throw new Error("Could not resolve recipient");
        await openDirectChat({ meActorId: myActorId, otherActorId });
      }
    } catch (e) {
      toast.error(e?.message || "Failed to start chat.");
    } finally {
      toast.dismiss(dismiss);
      setBusy(false);
    }
  }, [busy, myActorId, onMessage, profileId, resolveTargetActorId, openDirectChat]);

  // --- Render (Subscribe only; Message handled externally) ---
  return (
    <div className="flex flex-col gap-2 items-end">
      <SubscribeButton
        targetId={profileId}
        targetActorId={targetActorId || undefined}
        initialSubscribed={initialSubscribed}
        size="sm"
        className="w-full"
        onToggle={handleToggle}
        profileIsPrivate={Boolean(profileIsPrivate)}
      />
      {/* Message button intentionally removed — handled in ProfileHeader */}
    </div>
  );
}
