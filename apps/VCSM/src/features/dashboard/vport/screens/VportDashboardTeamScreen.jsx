import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useVportTeam } from "@/features/dashboard/vport/adapters/vport.adapter";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { BarberPickerModal } from "@/features/dashboard/vport/screens/components/team/BarberPickerModal";
import { renderMemberCard } from "@/features/dashboard/vport/screens/components/team/TeamMemberCards";

export function VportDashboardTeamScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity, identityLoading } = useIdentity();
  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const isDesktop = useDesktopBreakpoint();

  const viewerActorId = identity?.actorId ?? null;
  const isOwner =
    Boolean(actorId) &&
    Boolean(viewerActorId) &&
    String(viewerActorId) === String(actorId);

  const isBarbershop = identity?.vportType === "barbershop";

  const { members, loading, error, adding, addError, findEligibleBarbers, sendRequest, removeMember } =
    useVportTeam(isOwner ? actorId : null);

  const [showModal, setShowModal] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState("");

  if (!actorId) return null;

  if (identityLoading) {
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  }

  if (!identity) {
    return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  }

  if (!isOwner) {
    return <div className="p-10 text-center text-white/50">You can only manage your own team.</div>;
  }

  async function handleSelect(barberVportActorId, barberVportName) {
    try {
      await sendRequest(barberVportActorId, barberVportName);
      setShowModal(false);
    } catch {
      // addError set in hook
    }
  }

  async function handleRemove(resourceId) {
    setRemovingId(resourceId);
    setRemoveError("");
    try {
      await removeMember(resourceId);
    } catch (e) {
      setRemoveError(e?.message || "Failed to remove.");
    } finally {
      setRemovingId(null);
    }
  }

  const activeMembers = members.filter((m) => m.meta?.status !== "declined");
  const declinedMembers = members.filter((m) => m.meta?.status === "declined");
  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 1100 });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={() => navigate(`/actor/${actorId}/dashboard`)} />
            <div style={shell.title}>TEAM</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                {activeMembers.length} {activeMembers.length === 1 ? "member" : "members"}
              </div>
              {isBarbershop && (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl text-zinc-100"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  + Add barber
                </button>
              )}
            </div>

            {loading && <SkeletonCardList count={3} showBody={false} />}
            {!loading && error && <p className="text-sm text-rose-400">{error}</p>}
            {!loading && removeError && <p className="text-sm text-rose-400">{removeError}</p>}

            {!loading && !error && activeMembers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <div className="text-zinc-500 text-sm font-medium">No barbers yet.</div>
                <div className="text-zinc-600 text-xs">Add barbers who follow this shop.</div>
              </div>
            )}

            {!loading && !error && activeMembers.length > 0 && (
              <div className="space-y-2">
                {activeMembers.map((m) => renderMemberCard(m, { onRemove: handleRemove, removingId }))}
              </div>
            )}

            {!loading && !error && declinedMembers.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-xs text-zinc-700 px-1">Declined</div>
                {declinedMembers.map((m) => renderMemberCard(m, { onRemove: handleRemove, removingId }))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <BarberPickerModal
          actorId={actorId}
          adding={adding}
          addError={addError}
          findEligibleBarbers={findEligibleBarbers}
          onSelect={handleSelect}
          onClose={() => setShowModal(false)}
        />
      )}
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

export default VportDashboardTeamScreen;
