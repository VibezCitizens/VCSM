import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import {
  useOwnerBookingResources,
  useBookingAvailability,
  useManageAvailability,
  useEnsureOwnerBookingResource,
} from "@/features/booking/adapters/booking.adapter";
import { useVportDashboardContext } from "@/features/vportDashboard/adapters/vportDashboard.adapter";
import {
  usePublishBarbershopHoursPost,
  usePublishLocksmithPost,
} from "@/features/profiles/kinds/vport/adapters/vportProfiles.adapter";

export function useCalendarDashboard({ actorId }) {
  const { identity, identityLoading, availableActors } = useIdentity();
  const { loading: ownershipLoading, callerActorId: viewerActorId, canManage: isOwner } = useVportDashboardContext();

  const resources = useOwnerBookingResources({
    ownerActorId: actorId,
    includeInactive: true,
    enabled: isOwner && Boolean(actorId),
  });
  const { isPending: ensurePending, error: ensureError, ensure: ensureOwnerResource } =
    useEnsureOwnerBookingResource();
  const didBootstrap = useRef(false);

  const activeResources = useMemo(
    // Booking engine model exposes camelCase `isActive` (mapBookingResourceRows),
    // not snake_case `is_active`. Filtering on `is_active` silently dropped every
    // resource, leaving the calendar permanently on the "add a team member" empty state.
    () => resources.items.filter((r) => r.isActive),
    [resources.items]
  );
  const hasAnyResource = Boolean(resources.primary?.id);
  const resLoading = resources.loading;

  const [selectedResourceId, setSelectedResourceId] = useState(null);
  useEffect(() => { setSelectedResourceId(null); }, [actorId]);
  useEffect(() => {
    if (selectedResourceId) return;
    if (activeResources.length > 0) setSelectedResourceId(activeResources[0].id);
  }, [selectedResourceId, activeResources]);

  const selectedResource = useMemo(
    () => activeResources.find((r) => r.id === selectedResourceId) ?? null,
    [activeResources, selectedResourceId]
  );
  // Model exposes top-level `timezone` (defaulted to "UTC"), not `meta.timezone`.
  const resourceTz = selectedResource?.timezone ?? null;

  const [rangeAnchor] = useState(() => new Date());
  const rangeStart = useMemo(
    () => new Date(rangeAnchor.getFullYear(), rangeAnchor.getMonth(), 1).toISOString(),
    [rangeAnchor]
  );
  const rangeEnd = useMemo(
    () => new Date(rangeAnchor.getFullYear(), rangeAnchor.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    [rangeAnchor]
  );

  const availability = useBookingAvailability({
    resourceId: selectedResourceId,
    rangeStart,
    rangeEnd,
    enabled: Boolean(selectedResourceId) && isOwner,
  });
  const manageAvailability = useManageAvailability();

  const targetActorEntry = useMemo(
    () => availableActors?.find((a) => a.actorId === actorId) ?? null,
    [availableActors, actorId]
  );
  const isBarbershop = ["barbershop", "barber"].includes(
    String(targetActorEntry?.vportType ?? "").toLowerCase()
  );
  const isLocksmith =
    String(targetActorEntry?.vportType ?? "").toLowerCase() === "locksmith";

  const [shareToFeed, setShareToFeed] = useState(false);
  const { publishBarbershopHoursPost } = usePublishBarbershopHoursPost({ actorId });
  const { publishHoursPost: publishLocksmithHoursPost } = usePublishLocksmithPost({ actorId });

  const handleSaveSuccess = useCallback(
    async ({ blocks }) => {
      if (!shareToFeed) return;
      setShareToFeed(false);
      if (isBarbershop) {
        try {
          await publishBarbershopHoursPost({ blocks });
        } catch (err) {
          if (import.meta.env.DEV)
            console.error("[feed:publish] barbershop hours post failed", err);
        }
      } else if (isLocksmith) {
        try {
          await publishLocksmithHoursPost({ blocks });
        } catch (err) {
          if (import.meta.env.DEV)
            console.error("[feed:publish] locksmith hours post failed", err);
        }
      }
    },
    [shareToFeed, isBarbershop, isLocksmith, publishBarbershopHoursPost, publishLocksmithHoursPost]
  );

  const rules = useMemo(
    () => (Array.isArray(availability.data?.rules) ? availability.data.rules : []),
    [availability.data?.rules]
  );

  useEffect(() => { didBootstrap.current = false; }, [actorId]);
  useEffect(() => {
    if (!isOwner || !actorId || !viewerActorId) return;
    if (resLoading || resources.error || hasAnyResource || ensurePending || didBootstrap.current) return;
    didBootstrap.current = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    (async () => {
      const res = await ensureOwnerResource({
        requestActorId: viewerActorId,
        ownerActorId: actorId,
        timezone: tz,
      });
      if (res?.ok) await resources.refresh();
    })();
  }, [isOwner, actorId, viewerActorId, resLoading, resources, hasAnyResource, ensurePending, ensureOwnerResource]);

  return {
    identity,
    identityLoading,
    viewerActorId,
    isOwner,
    ownershipLoading,
    resources,
    resLoading,
    ensurePending,
    ensureError,
    activeResources,
    selectedResourceId,
    setSelectedResourceId,
    selectedResource,
    resourceTz,
    rangeStart,
    rangeEnd,
    availability,
    manageAvailability,
    isBarbershop,
    isLocksmith,
    shareToFeed,
    setShareToFeed,
    handleSaveSuccess,
    rules,
  };
}
