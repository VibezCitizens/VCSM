// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersIntegrateActor.screen.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useWandersActorIntegration } from "../hooks/useWandersActorIntegration";

import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function WandersIntegrateActorScreen() {
  const navigate = useNavigate();
  const query = useQuery();

  const integration = useWandersActorIntegration();
  // Expected integration API (best-effort):
  // integration.isAuthenticated (or integration.actor / integration.user)
  // integration.run({ inboxId?, inboxPublicId?, claimToken? }) -> result
  // integration.loading / integration.error
  const { isAuthenticated, actor, user, run, loading, error } = integration || {};

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [done, setDone] = useState(false);

  // Optional params to help controller attach/migrate ownership:
  // /wanders/claim?inbox=:id
  // /wanders/claim?public=:publicId
  // /wanders/claim?token=:claimToken
  const inboxId = query.get("inbox") || query.get("inboxId") || "";
  const inboxPublicId = query.get("public") || query.get("publicId") || "";
  const claimToken = query.get("token") || query.get("claim") || "";

  const authed = useMemo(() => {
    if (typeof isAuthenticated === "boolean") return isAuthenticated;
    if (actor) return true;
    if (user) return true;
    return false;
  }, [isAuthenticated, actor, user]);

  useEffect(() => {
    if (!authed) return;
    if (done) return;

    let cancelled = false;

    (async () => {
      setLocalLoading(true);
      setLocalError(null);

      try {
        const result = await Promise.resolve(
          run?.({
            ...(inboxId ? { inboxId } : {}),
            ...(inboxPublicId ? { inboxPublicId } : {}),
            ...(claimToken ? { claimToken } : {}),
          })
        );

        if (cancelled) return;

        setDone(true);

        // Best-effort next step:
        // - If controller returns a mailbox route or inbox route, honor it.
        // - Otherwise go to /wanders/mailbox.
        const next =
          result?.nextPath ||
          result?.redirectTo ||
          (result?.inboxPublicId ? `/wanders/i/${result.inboxPublicId}` : "") ||
          "/wanders/mailbox";

        navigate(next, { replace: true });
      } catch (e) {
        if (cancelled) return;
        setLocalError(e);
      } finally {
        if (!cancelled) setLocalLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authed, done, run, inboxId, inboxPublicId, claimToken, navigate]);

  if (loading || localLoading) return <WandersLoading />;

  if (error || localError) {
    return (
      <WandersEmptyState
        title="Could not connect your account"
        subtitle={String((error || localError)?.message || (error || localError))}
      />
    );
  }

  if (!authed) {
    return (
      <WandersEmptyState
        title="Sign in to claim this inbox"
        subtitle="Once you sign in, we’ll attach your anon inbox ownership to your account."
      />
    );
  }

  // Authenticated but no run() or it didn't redirect (stub / no-op)
  return (
    <WandersEmptyState
      title="Account connected"
      subtitle="You’re signed in. If nothing happened, your integration hook may still be a stub."
    />
  );
}
