import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import useVportOwnerResources from "@/features/dashboard/vport/hooks/useVportOwnerResources";
import useVportResourceAvailability from "@/features/dashboard/vport/hooks/useVportResourceAvailability";
import useVportManageAvailability from "@/features/dashboard/vport/hooks/useVportManageAvailability";
import useVportEnsureResource from "@/features/dashboard/vport/hooks/useVportEnsureResource";
import WeeklyAvailabilityGrid from "@/features/dashboard/vport/components/calendar/WeeklyAvailabilityGrid";
import ResourceDropdown from "@/features/dashboard/vport/components/calendar/ResourceDropdown";
import { usePublishBarbershopHoursPost } from "@/features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost";
import { usePublishLocksmithPost } from "@/features/profiles/kinds/vport/hooks/locksmith/usePublishLocksmithPost";

export function VportDashboardCalendarScreen() {
  const navigate  = useNavigate();
  const params    = useParams();
  const { identity, identityLoading } = useIdentity();
  const isDesktop = useDesktopBreakpoint();

  const actorId       = useMemo(() => params?.actorId ?? null, [params]);
  const viewerActorId = identity?.actorId ?? null;
  const isOwner       = Boolean(actorId) && Boolean(viewerActorId) && String(viewerActorId) === String(actorId);

  const goBack = useCallback(() => { if (actorId) navigate(`/actor/${actorId}/dashboard`); }, [navigate, actorId]);

  const resources = useVportOwnerResources({ ownerActorId: actorId, includeInactive: true, enabled: isOwner && Boolean(actorId) });
  const { isPending: ensurePending, error: ensureError, ensure: ensureOwnerResource } = useVportEnsureResource();
  const didBootstrap = useRef(false);

  const activeResources = useMemo(
    () => resources.resources.filter(r => r.is_active),
    [resources.resources]
  );
  const hasAnyResource = Boolean(resources.primary?.id);
  const resLoading     = resources.loading;

  const [selectedResourceId, setSelectedResourceId] = useState(null);
  useEffect(() => { setSelectedResourceId(null); }, [actorId]);
  useEffect(() => {
    if (selectedResourceId) return;
    if (activeResources.length > 0) setSelectedResourceId(activeResources[0].id);
  }, [selectedResourceId, activeResources]);

  const selectedResource = useMemo(
    () => activeResources.find(r => r.id === selectedResourceId) ?? null,
    [activeResources, selectedResourceId]
  );
  const resourceTz = selectedResource?.meta?.timezone ?? null;

  const [rangeAnchor] = useState(() => new Date());
  const rangeStart = useMemo(() => new Date(rangeAnchor.getFullYear(), rangeAnchor.getMonth(), 1).toISOString(), [rangeAnchor]);
  const rangeEnd   = useMemo(() => new Date(rangeAnchor.getFullYear(), rangeAnchor.getMonth() + 1, 0, 23, 59, 59).toISOString(), [rangeAnchor]);

  const availability       = useVportResourceAvailability({ resourceId: selectedResourceId, rangeStart, rangeEnd, enabled: Boolean(selectedResourceId) && isOwner });
  const manageAvailability = useVportManageAvailability();

  const isBarbershop = ["barbershop", "barber"].includes(
    String(identity?.vportType ?? "").toLowerCase()
  );
  const isLocksmith = String(identity?.vportType ?? "").toLowerCase() === "locksmith";
  const [shareToFeed, setShareToFeed] = useState(false);
  const { publishBarbershopHoursPost } = usePublishBarbershopHoursPost({ actorId });
  const { publishHoursPost: publishLocksmithHoursPost } = usePublishLocksmithPost({ actorId });

  const handleSaveSuccess = useCallback(
    async ({ blocks }) => {
      if (!shareToFeed) return;
      setShareToFeed(false);
      if (isBarbershop) {
        try { await publishBarbershopHoursPost({ blocks }); } catch { }
      } else if (isLocksmith) {
        try { await publishLocksmithHoursPost({ blocks }); } catch { }
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
      const res = await ensureOwnerResource({ requestActorId: viewerActorId, ownerActorId: actorId, timezone: tz });
      if (res?.ok) await resources.refresh();
    })();
  }, [isOwner, actorId, viewerActorId, resLoading, resources, hasAnyResource, ensurePending, ensureOwnerResource]);

  if (identityLoading) return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  if (!identity) return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  if (!actorId)  return <div className="p-10 text-center text-white/50">Invalid vport.</div>;
  if (!isOwner)  return <div className="p-10 text-center text-white/50">You can only manage your own calendar.</div>;

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 1140 });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={goBack} />
            <div style={shell.title}>CALENDAR SETTINGS</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 120px)", display: "grid", gap: 12 }}>
            <section style={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.22)", background: "rgba(2,6,23,.65)", padding: 16, display: "grid", gap: 14 }}>

              <div>
                <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Working Hours</div>
                <div style={{ color: "rgba(203,213,225,.5)", fontSize: 12, marginTop: 2 }}>
                  {isDesktop
                    ? "Drag to create · Click to select and delete · Drag bottom edge to resize"
                    : "Set your weekly business hours"}
                </div>
              </div>

              {(resLoading || ensurePending) && (
                <div style={{ color: "rgba(203,213,225,.8)", fontSize: 13 }}>
                  {ensurePending ? "Creating booking resource…" : "Loading…"}
                </div>
              )}
              {(resources.error || ensureError || availability.error) && (
                <div style={{ color: "#fca5a5", fontSize: 13 }}>
                  {import.meta.env.DEV
                    ? String(resources.error?.message ?? ensureError?.message ?? availability.error?.message ?? "Error loading.")
                    : "Calendar settings are unavailable right now."}
                </div>
              )}

              {(isBarbershop || isLocksmith) && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(203,213,225,.75)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={shareToFeed}
                    onChange={(e) => setShareToFeed(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "#818cf8", cursor: "pointer" }}
                  />
                  Share these hours to my feed
                </label>
              )}

              {!resLoading && !ensurePending && activeResources.length === 0 ? (
                <div style={{ borderRadius: 10, border: "1px dashed rgba(139,92,246,.2)", padding: "20px 16px", textAlign: "center", display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 13, color: "rgba(203,213,225,.6)" }}>
                    Add a team member before creating a schedule.
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/actor/${actorId}/dashboard/team`)}
                    style={{ alignSelf: "center", justifySelf: "center", borderRadius: 7, border: "1px solid rgba(139,92,246,.35)", background: "rgba(109,40,217,.2)", color: "rgba(167,139,250,.9)", fontSize: 12, fontWeight: 600, padding: "6px 14px", cursor: "pointer" }}
                  >
                    Go to Team →
                  </button>
                </div>
              ) : activeResources.length > 0 ? (
                <>
                  <ResourceDropdown
                    resources={activeResources}
                    selectedId={selectedResourceId}
                    onSelect={setSelectedResourceId}
                  />
                  {selectedResourceId && (
                    <WeeklyAvailabilityGrid
                      key={selectedResourceId}
                      resourceId={selectedResourceId}
                      viewerActorId={viewerActorId}
                      resourceTz={resourceTz}
                      rules={rules}
                      manageAvailability={manageAvailability}
                      availabilityRefresh={availability.refresh}
                      isMobile={!isDesktop}
                      onSaveSuccess={handleSaveSuccess}
                    />
                  )}
                </>
              ) : null}

            </section>
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

export default VportDashboardCalendarScreen;
