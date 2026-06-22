import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { useActorSummary } from "@/state/actors/useActorSummary";

export default function ActorPill() {
  const { identity } = useIdentity();
  const { displayName: hydratedName, avatar: hydratedAvatar } = useActorSummary(identity?.actorId);

  if (!identity) return null;

  const name = hydratedName || identity.displayName || (identity.kind === "vport" ? "VPORT" : "Profile");
  const avatar = hydratedAvatar || identity.avatar || identity.photoUrl || "/avatar.jpg";

  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full px-4 py-2"
      style={{
        border: '1.5px solid rgba(139, 92, 246, 0.4)',
        background: 'rgba(139, 92, 246, 0.12)',
        boxShadow: '0 0 12px rgba(139, 92, 246, 0.15), 0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <img
        src={avatar}
        alt={name}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/avatar.jpg";
        }}
        className="h-7 w-7 rounded-lg border border-white/12 object-cover"
      />
      <span className="text-[13px] font-medium text-white/80">
        Vibing as{' '}
        <span className="font-bold text-white">{name}</span>
      </span>
    </div>
  );
}
