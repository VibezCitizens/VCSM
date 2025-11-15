import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import vc from "@/lib/vcClient";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/state/identityContext";
import { getActorIdForUser } from "@/lib/actors/actors";

// shared UI buttons
import MessageButton from "@/ui/Profile/Messagebutton";
import SubscribeButton from "@/ui/Profile/Subscribebutton";

// NEW: actor-level blocks
import blocks from "@/data/user/blocks/blocks";

export default function VportSocialActions({
  vportId,
  initialSubscribed = false,
  onSubscribeToggle,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { identity } = useIdentity();
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(!!initialSubscribed);

  useEffect(() => {
    setSubscribed(!!initialSubscribed);
  }, [initialSubscribed]);

  const handleMessage = useCallback(
    async () => {
      try {
        if (!user?.id) return toast.error("Please sign in to message.");
        if (!vportId || busy) return;

        setBusy(true);
        const loading = toast.loading("Opening chat…");

        let myActorId = identity?.actorId ?? identity?.vportId ?? null;

        if (!myActorId) {
          const resolved = await getActorIdForUser(user.id);
          if (!resolved) {
            toast.dismiss(loading);
            return toast.error("Unable to find your actor profile.");
          }
          myActorId = resolved;
        }

        const { data: vportActor, error: actorErr } = await vc
          .from("actors")
          .select("id")
          .eq("vport_id", vportId)
          .maybeSingle();

        if (actorErr || !vportActor?.id) {
          toast.dismiss(loading);
          return toast.error("Unable to start chat.");
        }

        // NEW: respect actor-based blocks in either direction
        try {
          const blocked = await blocks.hasActorBlockEitherDirection(
            myActorId,
            vportActor.id
          );
          if (blocked) {
            toast.dismiss(loading);
            return toast.error("You can't message this profile.");
          }
        } catch (blockErr) {
          console.error("[VportSocialActions] block check failed:", blockErr);
          // If block check fails, fall through and try to open chat anyway
        }

        const { data: convId, error: convErr } = await vc.rpc(
          "vc_get_or_create_one_to_one",
          {
            a1: myActorId,
            a2: vportActor.id,
          }
        );

        if (convErr || !convId) {
          toast.dismiss(loading);
          return toast.error("Failed to open chat.");
        }

        const path =
          identity?.type === "vport"
            ? `/vport/chat/${convId}`
            : `/chat/${convId}`;
        toast.dismiss(loading);
        navigate(path);
      } catch (err) {
        console.error(err);
        toast.error("Could not open chat.");
      } finally {
        setBusy(false);
      }
    },
    [user?.id, vportId, identity, busy, navigate]
  );

  const handleSubscribeToggle = useCallback(
    async () => {
      if (busy) return;
      if (!user?.id) return toast.error("Please sign in to subscribe.");
      if (!vportId) return;

      setBusy(true);
      const next = !subscribed;
      setSubscribed(next);
      onSubscribeToggle?.(next); // optimistic → let parent bump count

      try {
        // 1) Resolve my actor (viewer)
        let myActorId = identity?.actorId ?? identity?.vportId ?? null;

        if (!myActorId) {
          const resolved = await getActorIdForUser(user.id);
          if (!resolved) {
            throw new Error("Unable to find your actor profile.");
          }
          myActorId = resolved;
        }

        // 2) Resolve vport's actor
        const { data: vportActor, error: actorErr } = await vc
          .from("actors")
          .select("id")
          .eq("vport_id", vportId)
          .maybeSingle();

        if (actorErr || !vportActor?.id) {
          throw new Error("Unable to resolve VPort actor.");
        }

        // 3) Write to unified follow graph vc.actor_follows
        if (next) {
          const { error } = await vc
            .from("actor_follows")
            .upsert({
              follower_actor_id: myActorId,
              followed_actor_id: vportActor.id,
              is_active: true,
            });

          if (error) throw error;
          toast.success("Subscribed");
        } else {
          const { error } = await vc
            .from("actor_follows")
            .update({ is_active: false })
            .eq("follower_actor_id", myActorId)
            .eq("followed_actor_id", vportActor.id);

          if (error) throw error;
          toast.success("Unsubscribed");
        }
      } catch (err) {
        console.error(err);
        // revert optimistic toggle
        setSubscribed(!next);
        onSubscribeToggle?.(!next);
        toast.error(err?.message || "Failed to update subscription.");
      } finally {
        setBusy(false);
      }
    },
    [busy, user?.id, vportId, subscribed, onSubscribeToggle, identity]
  );

  return (
    <div className="flex flex-col items-end gap-2">
      <MessageButton onClick={handleMessage} disabled={busy} />

      <SubscribeButton
        isSubscribed={subscribed}
        onClick={handleSubscribeToggle}
        disabled={busy}
      />
    </div>
  );
}
