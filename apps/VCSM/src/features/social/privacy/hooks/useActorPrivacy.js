import { useEffect, useState } from "react";
import { ctrlGetActorPrivacy } from "@/features/social/privacy/controllers/getActorPrivacy.controller";

export function useActorPrivacy({ actorId }) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(Boolean(actorId));

  useEffect(() => {
    let alive = true;

    if (!actorId) {
      setIsPrivate(false);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    setLoading(true);

    ctrlGetActorPrivacy({ actorId })
      .then((result) => {
        if (!alive) return;
        setIsPrivate(Boolean(result?.isPrivate));
      })
      .catch((error) => {
        if (!alive) return;
        console.error("[useActorPrivacy] failed", error);
        setIsPrivate(false);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [actorId]);

  return { isPrivate, loading };
}
