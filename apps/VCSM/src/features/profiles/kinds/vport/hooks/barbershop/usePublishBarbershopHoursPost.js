import { useCallback } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { publishBarbershopHoursUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller";

export function usePublishBarbershopHoursPost({ actorId }) {
  const { identity } = useIdentity();

  const publishBarbershopHoursPost = useCallback(
    async ({ blocks }) => {
      if (!actorId) return { published: false, status: "skipped", reason: "no_actor" };
      const callerActorId = identity?.actorId ?? null;
      if (!callerActorId) return { published: false, status: "failed", reason: "not_authenticated" };
      return publishBarbershopHoursUpdateAsPostController({ actorId, blocks, callerActorId });
    },
    [actorId, identity]
  );

  return { publishBarbershopHoursPost };
}
