import React from "react";
import { useActorSummary } from "@hydration";

function MemberAvatar({ actorId, name, dimmed }) {
  const summary = useActorSummary(actorId);
  const initial = String(name || summary.displayName || "?")[0].toUpperCase();
  return (
    <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      {summary.avatar && summary.avatar !== "/avatar.jpg" ? (
        <img
          src={summary.avatar}
          alt={summary.displayName || name}
          className="w-full h-full object-cover"
          style={{ opacity: dimmed ? 0.5 : 1 }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-sm font-semibold"
          style={{ color: dimmed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)" }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

function PendingCard({ member, onRemove, removing }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
      <div className="flex items-center gap-3">
        <MemberAvatar actorId={member.member_actor_id} name={member.name} dimmed />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-zinc-300 truncate">{member.name}</div>
          <div className="text-xs text-zinc-600 mt-0.5">Waiting for barber approval</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full text-amber-400" style={{ background: "rgba(251,191,36,0.1)" }}>Pending</span>
          <button
            type="button"
            onClick={() => onRemove(member.id)}
            disabled={removing}
            className="text-xs text-zinc-500 hover:text-rose-400 disabled:opacity-40 transition-colors px-2 py-0.5 rounded-lg"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {removing ? "…" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveCard({ member, onRemove, removing }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-3">
        <MemberAvatar actorId={member.member_actor_id} name={member.name} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-zinc-100 truncate">{member.name}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Barber · Staff</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full text-emerald-400" style={{ background: "rgba(52,211,153,0.12)" }}>Active</span>
          <button type="button" onClick={() => onRemove(member.id)} disabled={removing} className="text-xs text-zinc-600 hover:text-rose-400 disabled:opacity-40 transition-colors">✕</button>
        </div>
      </div>
    </div>
  );
}

function DeclinedCard({ member, onRemove, removing }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
      <div className="flex items-center gap-3">
        <MemberAvatar actorId={member.member_actor_id} name={member.name} dimmed />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-zinc-500 truncate">{member.name}</div>
          <div className="text-xs text-zinc-700 mt-0.5">Request declined</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full text-rose-400" style={{ background: "rgba(239,68,68,0.1)" }}>Declined</span>
          <button type="button" onClick={() => onRemove(member.id)} disabled={removing} className="text-xs text-zinc-600 hover:text-rose-400 disabled:opacity-40 transition-colors">✕</button>
        </div>
      </div>
    </div>
  );
}

export function renderMemberCard(member, { onRemove, removingId }) {
  const status = member.meta?.status ?? (member.is_active ? "linked" : null);
  if (status === "pending_acceptance") {
    return <PendingCard key={member.id} member={member} onRemove={onRemove} removing={removingId === member.id} />;
  }
  if (status === "declined") {
    return <DeclinedCard key={member.id} member={member} onRemove={onRemove} removing={removingId === member.id} />;
  }
  return <ActiveCard key={member.id} member={member} onRemove={onRemove} removing={removingId === member.id} />;
}
