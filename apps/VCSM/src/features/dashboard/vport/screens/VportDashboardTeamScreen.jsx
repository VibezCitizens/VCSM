import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { useVportTeamAccess } from "@/features/dashboard/vport/hooks/useVportTeamAccess";
import { TeamMemberCard } from "@/features/dashboard/vport/screens/components/team/TeamMemberCards";
import { AddTeamMemberSheet } from "@/features/dashboard/vport/screens/components/team/AddTeamMemberSheet";
import { ConfirmRemoveModal } from "@/features/dashboard/vport/screens/components/team/ConfirmRemoveModal";

export function VportDashboardTeamScreen() {
  const navigate = useNavigate();
  const params   = useParams();
  const { identity, identityLoading } = useIdentity();
  const isDesktop = useDesktopBreakpoint();

  const actorId       = useMemo(() => params?.actorId ?? null, [params]);
  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId);

  const { members, loading, error, addMember, updateRole, setStatus, removeMember, searchCandidates } =
    useVportTeamAccess(actorId, isOwner);

  const [showAddSheet,  setShowAddSheet]  = useState(false);
  const [adding,        setAdding]        = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [removing,      setRemoving]      = useState(false);
  const [removeError,   setRemoveError]   = useState("");
  const [mutateError,   setMutateError]   = useState("");

  const activeMembers   = useMemo(() => members.filter((m) => m.status === "active"),   [members]);
  const inactiveMembers = useMemo(() => members.filter((m) => m.status === "inactive"), [members]);
  const pendingMembers  = useMemo(() => members.filter((m) => m.status === "pending"),  [members]);
  const declinedMembers = useMemo(() => members.filter((m) => m.status === "declined"), [members]);

  const handleAdd = useCallback(async (payload) => {
    setAdding(true);
    setMutateError("");
    try {
      await addMember(payload);
      setShowAddSheet(false);
    } catch (e) {
      throw e;
    } finally {
      setAdding(false);
    }
  }, [addMember]);

  const handleUpdateRole = useCallback(async ({ resourceId, role }) => {
    setMutateError("");
    try {
      await updateRole({ resourceId, role });
    } catch (e) {
      setMutateError(e?.message || "Failed to update role.");
      throw e;
    }
  }, [updateRole]);

  const handleSetStatus = useCallback(async ({ resourceId, status }) => {
    setMutateError("");
    try {
      await setStatus({ resourceId, status });
    } catch (e) {
      setMutateError(e?.message || "Failed to update status.");
      throw e;
    }
  }, [setStatus]);

  const handleRemoveRequest = useCallback((member) => {
    setRemoveError("");
    setPendingRemove(member);
  }, []);

  const handleRemoveConfirm = useCallback(async () => {
    if (!pendingRemove) return;
    setRemoving(true);
    setRemoveError("");
    try {
      await removeMember({ resourceId: pendingRemove.resource_id });
      setPendingRemove(null);
    } catch (e) {
      setRemoveError(e?.message || "Failed to remove member.");
    } finally {
      setRemoving(false);
    }
  }, [pendingRemove, removeMember]);

  if (!actorId) return null;

  if (identityLoading || ownershipLoading) {
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  }
  if (!identity) {
    return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  }
  if (!isOwner) {
    return <div className="p-10 text-center text-white/50">You can only manage your own team.</div>;
  }

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 1100 });

  function MemberSection({ title, list }) {
    if (!list.length) return null;
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {title && (
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,.32)", letterSpacing: ".07em", paddingLeft: 2 }}>
            {title}
          </div>
        )}
        {list.map((m) => (
          <TeamMemberCard
            key={m.resource_id}
            member={m}
            isOwner={isOwner}
            viewerActorId={viewerActorId}
            onUpdateRole={handleUpdateRole}
            onSetStatus={handleSetStatus}
            onRemove={handleRemoveRequest}
          />
        ))}
      </div>
    );
  }

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={() => navigate(`/actor/${actorId}/dashboard`)} />
            <div style={shell.title}>TEAM</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)", display: "grid", gap: 14 }}>

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,.42)" }}>
                {activeMembers.length} {activeMembers.length === 1 ? "active member" : "active members"}
              </div>
              <button
                type="button"
                onClick={() => setShowAddSheet(true)}
                style={{
                  height: 34, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  border: "1px solid rgba(139,92,246,.3)",
                  background: "rgba(139,92,246,.12)",
                  color: "rgba(167,139,250,.9)",
                }}
              >
                + Add Member
              </button>
            </div>

            {mutateError && (
              <div style={{ borderRadius: 8, background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.16)", padding: "9px 12px", fontSize: 12, color: "#fca5a5" }}>
                {mutateError}
              </div>
            )}

            {loading && <SkeletonCardList count={3} showBody={false} />}
            {!loading && error && <div style={{ fontSize: 13, color: "#fca5a5" }}>{error}</div>}

            {!loading && !error && members.length === 0 && (
              <div style={{
                borderRadius: 14, border: "1px dashed rgba(139,92,246,.14)",
                padding: "36px 20px", textAlign: "center", display: "grid", gap: 8,
              }}>
                <div style={{ fontSize: 13, color: "rgba(148,163,184,.42)" }}>No team members yet.</div>
                <div style={{ fontSize: 12, color: "rgba(148,163,184,.28)" }}>Add members to collaborate on this vport.</div>
              </div>
            )}

            {!loading && !error && (
              <>
                <MemberSection list={activeMembers} />
                <MemberSection title="PENDING" list={pendingMembers} />
                <MemberSection title="INACTIVE" list={inactiveMembers} />
                <MemberSection title="DECLINED" list={declinedMembers} />
              </>
            )}

          </div>
        </div>
      </div>

      {showAddSheet && (
        <AddTeamMemberSheet
          onAdd={handleAdd}
          onClose={() => setShowAddSheet(false)}
          searchCandidates={searchCandidates}
          adding={adding}
          isDesktop={isDesktop}
        />
      )}

      {pendingRemove && (
        <ConfirmRemoveModal
          member={pendingRemove}
          removing={removing}
          error={removeError}
          onConfirm={handleRemoveConfirm}
          onCancel={() => { setPendingRemove(null); setRemoveError(""); }}
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
