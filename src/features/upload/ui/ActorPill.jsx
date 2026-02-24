import { useIdentity } from "@/state/identity/identityContext";

export default function ActorPill() {
  const { identity } = useIdentity();
  if (!identity) return null;

  const name = identity.displayName || (identity.kind === "vport" ? "VPORT" : "Profile");
  const avatar = identity.avatar || identity.photoUrl || "/avatar.jpg";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/25 bg-slate-900/65 px-3.5 py-1.5 shadow-[0_6px_18px_rgba(18,24,55,0.32)]">
      <img
        src={avatar}
        alt={name}
        className="h-6 w-6 rounded-md border border-slate-300/20 object-cover"
      />
      <span className="text-xs text-slate-300">
        Vibing as <span className="font-semibold text-slate-100">{name}</span>
      </span>
    </div>
  );
}
