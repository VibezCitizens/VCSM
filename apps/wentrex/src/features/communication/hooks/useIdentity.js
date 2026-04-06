import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";

// realmId requires one organization query; cache it for the session
let _realmCache = null;

export function useIdentity() {
  const { actorId, organizationId, loading: identityLoading } = useWentrexActorId();
  const [realmId, setRealmId] = useState(_realmCache?.realmId ?? null);
  const [realmLoading, setRealmLoading] = useState(!_realmCache);

  useEffect(() => {
    if (identityLoading || !organizationId) return;

    // Use cached realm if organizationId matches
    if (_realmCache?.organizationId === organizationId) {
      setRealmId(_realmCache.realmId);
      setRealmLoading(false);
      return;
    }

    let cancelled = false;
    setRealmLoading(true);

    supabase
      .schema("learning")
      .from("organizations")
      .select("realm_id")
      .eq("id", organizationId)
      .maybeSingle()
      .then(({ data: org }) => {
        if (cancelled) return;
        const resolved = org?.realm_id ?? null;
        _realmCache = { organizationId, realmId: resolved };
        setRealmId(resolved);
        setRealmLoading(false);
      });

    return () => { cancelled = true; };
  }, [identityLoading, organizationId]);

  const loading = identityLoading || realmLoading;

  const identity =
    actorId && organizationId
      ? { actorId, realmId, organizationId, kind: "user" }
      : null;

  return { identity, loading };
}

export default useIdentity;
