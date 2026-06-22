import { useCallback, useMemo } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { publishLocksmithServiceAreaUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller";
import { publishLocksmithHoursUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller";
import { publishLocksmithPortfolioUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller";

export function usePublishLocksmithPost({ actorId }) {
  const { identity, availableActors } = useIdentity();
  const identityActorId = useMemo(() => {
    if (identity?.kind === "user") return identity.actorId ?? null;
    const userActor = availableActors?.find((a) => a.actorKind === "user");
    return userActor?.actorId ?? null;
  }, [identity, availableActors]);

  const publishServiceAreaPost = useCallback(
    async (area) => {
      if (!actorId) return { published: false, status: "skipped", reason: "no_actor" };
      if (!identityActorId) return { published: false, status: "failed", reason: "no_identity" };
      return publishLocksmithServiceAreaUpdateAsPostController({ identityActorId, actorId, area });
    },
    [actorId, identityActorId]
  );

  const publishHoursPost = useCallback(
    async ({ blocks }) => {
      if (!actorId) return { published: false, status: "skipped", reason: "no_actor" };
      if (!identityActorId) return { published: false, status: "failed", reason: "no_identity" };
      return publishLocksmithHoursUpdateAsPostController({ identityActorId, actorId, blocks });
    },
    [actorId, identityActorId]
  );

  const publishPortfolioPost = useCallback(
    async ({ portfolioTitle, jobType, mediaUrl }) => {
      if (!actorId) return { published: false, status: "skipped", reason: "no_actor" };
      if (!identityActorId) return { published: false, status: "failed", reason: "no_identity" };
      return publishLocksmithPortfolioUpdateAsPostController({
        identityActorId,
        actorId,
        portfolioTitle,
        jobType,
        mediaUrl,
      });
    },
    [actorId, identityActorId]
  );

  return { publishServiceAreaPost, publishHoursPost, publishPortfolioPost };
}
