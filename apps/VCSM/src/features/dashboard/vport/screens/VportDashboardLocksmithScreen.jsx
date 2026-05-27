import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Plus, Wrench } from "lucide-react";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";

import { useLocksmithProfile, useLocksmithOwner } from "@/features/profiles/adapters/profiles.adapter";
import { usePublishLocksmithPost } from "@/features/profiles/adapters/profiles.adapter";
import {
  AreaForm,
  AreaCard,
  ServiceDetailRow,
  GapServiceRow,
} from "@/features/dashboard/vport/screens/components/locksmithScreenComponents";

export default function VportDashboardLocksmithScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity } = useIdentity();
  const targetActorId = params?.actorId ?? null;
  const viewerActorId = identity?.actorId ?? null;
  const isDesktop = useDesktopBreakpoint();
  const { isOwner } = useVportOwnership(viewerActorId, targetActorId);

  const { serviceAreas, serviceDetails, gapServices, loading, reload } = useLocksmithProfile(targetActorId, "locksmith");
  const owner = useLocksmithOwner(targetActorId, { onSuccess: reload });
  const { publishServiceAreaPost } = usePublishLocksmithPost({ actorId: targetActorId });

  const [showAddArea, setShowAddArea] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [deletingAreaId, setDeletingAreaId] = useState(null);

  const handleAddArea = useCallback(async (area, { shareToFeed } = {}) => {
    try {
      await owner.addArea(area);
      setShowAddArea(false);
      if (shareToFeed) {
        try { await publishServiceAreaPost(area); } catch (_) {}
      }
    } catch (_) {}
  }, [owner, publishServiceAreaPost]);

  const handleUpdateArea = useCallback(async (area, { shareToFeed } = {}) => {
    if (!editingArea?.id) return;
    try {
      await owner.updateArea(editingArea.id, area);
      setEditingArea(null);
      if (shareToFeed) {
        try { await publishServiceAreaPost(area); } catch (_) {}
      }
    } catch (_) {}
  }, [owner, editingArea, publishServiceAreaPost]);

  const handleDeleteArea = useCallback(async (areaId) => {
    setDeletingAreaId(areaId);
    try {
      await owner.deleteArea(areaId);
    } catch (_) {}
    finally {
      setDeletingAreaId(null);
    }
  }, [owner]);

  const shell = useMemo(
    () => createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 900 }),
    [isDesktop]
  );

  if (!targetActorId) return null;
  if (!isOwner) return <div className="p-10 text-center text-white/50">Owner access only.</div>;

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={() => navigate(`/actor/${targetActorId}/dashboard`)} />
            <div style={shell.title}>LOCKSMITH</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }}>
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2"><MapPin size={15} /> Service Areas</div>
                  <div className="mt-0.5 text-xs text-white/40">Where you provide locksmith services</div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`lk-skel:${i}`} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--vc-card-bg)' }}>
                      <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl" style={{ background: 'rgba(139,92,246,0.08)' }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-28 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.1)' }} />
                        <div className="h-2 w-20 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.06)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceAreas.map((area) => (
                    editingArea?.id === area.id ? (
                      <AreaForm key={area.id} initial={area} onSave={handleUpdateArea} onCancel={() => setEditingArea(null)} saving={owner.saving} />
                    ) : (
                      <AreaCard key={area.id} area={area} onEdit={setEditingArea} onDelete={handleDeleteArea} deleting={deletingAreaId === area.id} />
                    )
                  ))}

                  {!serviceAreas.length && !showAddArea ? (
                    <div className="rounded-xl border border-white/6 bg-white/[0.02] py-6 text-center text-sm text-white/30">
                      No service areas configured yet.
                    </div>
                  ) : null}

                  {showAddArea ? (
                    <AreaForm onSave={handleAddArea} onCancel={() => setShowAddArea(false)} saving={owner.saving} />
                  ) : (
                    <button type="button" onClick={() => setShowAddArea(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-3 text-sm text-white/40 hover:border-sky-300/30 hover:text-sky-200/70 transition-colors">
                      <Plus size={16} /> Add service area
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="mb-3">
                <div className="text-sm font-semibold text-white flex items-center gap-2"><Wrench size={15} /> Service Details</div>
                <div className="mt-0.5 text-xs text-white/40">Locksmith-specific metadata for your services</div>
              </div>

              {serviceDetails.length || gapServices.length ? (
                <div className="space-y-1.5">
                  {serviceDetails.map((d) => (
                    <ServiceDetailRow key={d.serviceId} detail={d} />
                  ))}
                  {gapServices.map((svc) => (
                    <GapServiceRow key={svc.id} service={svc} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/6 bg-white/[0.02] py-6 text-center text-sm text-white/30">
                  No service details configured yet. Select services first, then configure response time, pricing, and requirements here.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
              <div className="text-xs font-medium text-white/40 mb-2">Quick Summary</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-white">{serviceAreas.length}</div>
                  <div className="text-[10px] text-white/35">Areas</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{serviceDetails.length + gapServices.length}</div>
                  <div className="text-[10px] text-white/35">Services</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{serviceAreas.filter((a) => a.isEmergencyCovered).length}</div>
                  <div className="text-[10px] text-white/35">Emergency</div>
                </div>
              </div>
            </div>

            {owner.error ? (
              <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                {owner.error?.message || owner.error?.details || owner.error?.hint || JSON.stringify(owner.error)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>{content}</div>,
      document.body,
    );
  }

  return content;
}
