import { useCallback } from "react";
import { publishMenuUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller";

export function usePublishMenuPost({ actorId }) {
  const publishMenuPost = useCallback(
    async ({ action, subject, subjectName, categoryName = null, imageUrl = null }) => {
      if (!actorId) return { published: false, reason: "no_actor" };
      return publishMenuUpdateAsPostController({ actorId, action, subject, subjectName, categoryName, imageUrl });
    },
    [actorId]
  );

  return { publishMenuPost };
}
