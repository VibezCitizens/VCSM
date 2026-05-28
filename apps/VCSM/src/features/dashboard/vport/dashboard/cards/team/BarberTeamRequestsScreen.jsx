import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import { useBarberTeamRequests } from "@/features/dashboard/vport/dashboard/cards/team/hooks/useBarberTeamRequests";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import VportBackButton from "@/features/dashboard/shared/components/BackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { useActorSummary } from "@hydration";

function RequestCard({ request, onAccept, onDecline, working }) {
  const shopName = request.barbershop?.name ?? "A barbershop";
  const shopActorId = request.barbershop?.actor_id ?? null;
  const shopActor = useActorSummary(shopActorId);
  const avatar = shopActor?.avatar ?? null;

  return (
    <div
      className="rounded-xl px-4 py-3 space-y-3"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={shopName}
            className="shrink-0 w-10 h-10 rounded-lg object-cover"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            onError={(e) => { e.currentTarget.src = "/avatar.jpg"; }}
          />
        ) : (
          <div
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold text-zinc-300"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            {String(shopName)[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-100 truncate">{shopName}</div>
          <div className="text-xs text-zinc-500 mt-0.5">
            Wants to add you to their barbershop team
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onAccept(request.id)}
          disabled={working}
          className="flex-1 text-sm font-semibold py-2.5 rounded-xl text-zinc-100 disabled:opacity-40 transition-colors"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }}
        >
          {working ? "…" : "Accept"}
        </button>
        <button
          type="button"
          onClick={() => onDecline(request.id)}
          disabled={working}
          className="flex-1 text-sm font-semibold py-2.5 rounded-xl text-zinc-500 hover:text-rose-400 disabled:opacity-40 transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

export function BarberTeamRequestsScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity, identityLoading } = useIdentity();
  const actorId = useMemo(() => params?.actorId ?? null, [params]);
  const isDesktop = useDesktopBreakpoint();

  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId);

  const { requests, loading, error, working, workError, accept, decline } = useBarberTeamRequests(
    isOwner ? actorId : null,
    viewerActorId
  );

  if (!actorId) return null;

  if (identityLoading || ownershipLoading) {
    return (
      <div className="px-4 py-6">
        <SkeletonCardList count={2} showBody={false} />
      </div>
    );
  }

  if (!identity || !isOwner) {
    return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  }

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 1100 });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton
              isDesktop={isDesktop}
              onClick={() => navigate(`/actor/${actorId}/dashboard`)}
            />
            <div style={shell.title}>TEAM REQUESTS</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }} className="space-y-3">
            {loading && <SkeletonCardList count={2} showBody={false} />}

            {!loading && error && <p className="text-sm text-rose-400">{error}</p>}
            {!loading && workError && <p className="text-sm text-rose-400">{workError}</p>}

            {!loading && !error && requests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <div className="text-zinc-500 text-sm font-medium">No pending requests.</div>
                <div className="text-zinc-600 text-xs">
                  Barbershops you follow can send you team requests here.
                </div>
              </div>
            )}

            {!loading && !error && requests.length > 0 && (
              <div className="space-y-2">
                {requests.map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    onAccept={accept}
                    onDecline={decline}
                    working={working}
                  />
                ))}
              </div>
            )}
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

export default BarberTeamRequestsScreen;
