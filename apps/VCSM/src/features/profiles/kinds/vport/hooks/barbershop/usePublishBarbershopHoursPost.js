import { useCallback } from "react";
import { publishBarbershopHoursUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller";

export function usePublishBarbershopHoursPost({ actorId }) {
  const publishBarbershopHoursPost = useCallback(
    async ({ blocks }) => {
      if (!actorId) return { published: false, reason: "no_actor" };
      return publishBarbershopHoursUpdateAsPostController({ actorId, blocks });
    },
    [actorId]
  );

  return { publishBarbershopHoursPost };
}
