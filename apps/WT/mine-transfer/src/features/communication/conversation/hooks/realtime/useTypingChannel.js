import { useEffect, useRef, useState, useCallback } from "react";

import {
  ctrlCreateTypingPresenceChannel,
  ctrlRemoveTypingPresenceChannel,
  ctrlTrackTypingPresence,
} from "@/features/chat/conversation/controllers/realtime/typingPresence.controller";

export default function useTypingChannel({
  conversationId,
  actorId,
  actorPresentation,
  timeoutMs = 3000,
}) {
  const [typingActors, setTypingActors] = useState([]);

  const channelRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!conversationId || !actorId) return undefined;

    ctrlRemoveTypingPresenceChannel(channelRef.current);
    channelRef.current = null;

    const channel = ctrlCreateTypingPresenceChannel({ conversationId, actorId });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const actors = Object.values(state)
          .flat()
          .map((presence) => presence.actor)
          .filter((actor) => actor && actor.actor_id && actor.actor_id !== actorId);
        setTypingActors(actors);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ctrlTrackTypingPresence({ channel, actorPresentation });
        }
      });

    channelRef.current = channel;

    return () => {
      ctrlRemoveTypingPresenceChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [conversationId, actorId, actorPresentation]);

  const notifyTyping = useCallback(async () => {
    if (!channelRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    await ctrlTrackTypingPresence({
      channel: channelRef.current,
      actorPresentation,
    });

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
    }, timeoutMs);
  }, [actorPresentation, timeoutMs]);

  return {
    typingActors,
    notifyTyping,
  };
}
