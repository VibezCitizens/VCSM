import { useIdentity } from "@/state/identity/identityContext";

export default function ActorPill() {
  const { identity } = useIdentity();

  if (!identity) return null;

  const name = identity.displayName || (identity.kind === "vport" ? "VPORT" : "Profile");
  const avatar = identity.avatar || "/avatar.jpg";

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800">
      <img src={avatar} className="w-5 h-5 rounded-md object-cover border border-neutral-700/70" />
      <span className="text-xs text-white/80">
        Posting as <span className="font-semibold text-white">{name}</span>
      </span>
    </div>
  );
}
