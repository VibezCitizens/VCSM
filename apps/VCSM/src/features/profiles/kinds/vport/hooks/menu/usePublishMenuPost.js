import { useCallback, useMemo } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { publishMenuUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller";

export function usePublishMenuPost({ actorId }) {
  const { identity, availableActors } = useIdentity();
  const identityActorId = useMemo(() => {
    if (identity?.kind === "user") return identity.actorId ?? null;
    const userActor = availableActors?.find((a) => a.actorKind === "user");
    return userActor?.actorId ?? null;
  }, [identity, availableActors]);

  const publishMenuPost = useCallback(
    async ({ action, subject, subjectName, categoryName = null, imageUrl = null }) => {
      if (!actorId) return { published: false, status: "skipped", reason: "no_actor" };
      if (!identityActorId) return { published: false, status: "failed", reason: "no_identity" };
      return publishMenuUpdateAsPostController({
        identityActorId,
        actorId,
        action,
        subject,
        subjectName,
        categoryName,
        imageUrl,
      });
    },
    [actorId, identityActorId]
  );

  return { publishMenuPost };
}
