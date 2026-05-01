import { useEffect, useState } from "react";
import { checkActorOwnershipController } from "@/features/profiles/controller/checkActorOwnership.controller";

export function useIsActorOwner({ userId, actorId, directMatch = false }) {
  const [ownsViaAccount, setOwnsViaAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Direct actor match is already known — skip the DB call
    if (directMatch) {
      setOwnsViaAccount(false);
      return;
    }
    if (!userId || !actorId) return;

    let cancelled = false;
    setLoading(true);
    checkActorOwnershipController({ userId, actorId })
      .then((owns) => { if (!cancelled) setOwnsViaAccount(owns); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId, actorId, directMatch]);

  return { ownsViaAccount, loading };
}
