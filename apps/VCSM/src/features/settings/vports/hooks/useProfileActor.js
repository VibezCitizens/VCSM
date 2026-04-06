// src/features/settings/vports/hooks/useProfileActor.js
import { useEffect, useState } from "react";
import { ctrlGetProfileActorId } from "@/features/settings/vports/controller/getProfileActorId.controller";

export function useProfileActor(userId) {
  const [profileActorId, setProfileActorId] = useState(null);

  useEffect(() => {
    if (!userId) return;

    let alive = true;

    (async () => {
      try {
        const userActorId = await ctrlGetProfileActorId({ userId });
        if (alive) {
          setProfileActorId(userActorId ?? null);
        }
      } catch (e) {
        console.error("[useProfileActor] failed", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  return profileActorId;
}
