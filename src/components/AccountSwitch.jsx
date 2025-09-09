// src/components/AccountSwitch.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/state/identityContext";
import toast from "react-hot-toast";

export default function AccountSwitch() {
  const { identity, actAsUser, actAsVport, isVport } = useIdentity();
  const [vports, setVports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fetch owned VPORTs
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!identity?.userId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("vports")
        .select("id, name, avatar_url")
        .eq("created_by", identity.userId)
        .order("created_at", { ascending: false });
      setLoading(false);
      if (error) {
        console.error(error);
        return;
      }
      if (!cancel) {
        setVports(
          (data || []).map((v) => ({
            id: v.id,
            role: "owner",
            name: v.name || "VPORT",
            avatar: v.avatar_url || "/avatar.jpg",
          }))
        );
      }
    })();
    return () => {
      cancel = true;
    };
  }, [identity?.userId]);

  const activeVportId = isVport ? identity?.vportId : null;
  const currentLabel = isVport ? "Acting as VPORT" : "Acting as You";

  const items = useMemo(
    () => [
      {
        id: null,
        name: "Act as user",
        sub: "Post & react as yourself",
        avatar: "/avatar.jpg",
      },
      ...vports.map((v) => ({
        id: v.id,
        name: v.name,
        sub: "Switch to this VPORT",
        avatar: v.avatar,
      })),
    ],
    [vports]
  );

  async function handleSwitch(id) {
    if (busy) return;
    try {
      setBusy(true);
      if (id === null) {
        const ok = actAsUser();
        if (!ok) return toast.error("Couldn't switch to your account.");
        toast.success("Switched to your account");
      } else {
        const ok = actAsVport(id);
        if (!ok) return toast.error("You do not have permission to act as this VPORT.");
        const name = vports.find((v) => v.id === id)?.name || "VPORT";
        toast.success(`Switched to ${name}`);
      }
    } finally {
      setBusy(false);
    }
  }

  const isActive = (id) => (activeVportId || null) === (id || null);

  return (
    <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-neutral-400">{currentLabel}</div>
        {loading && <span className="text-xs text-neutral-500">Loading…</span>}
      </div>

      <div className="space-y-2" role="radiogroup" aria-label="Account switch">
        {items.map(({ id, name, sub, avatar }) => (
          <button
            key={id ?? "user"}
            type="button"
            onClick={() => handleSwitch(id)}
            disabled={busy}
            className={`w-full text-left p-2 rounded-lg border flex items-center justify-between gap-3 transition
              ${isActive(id) ? "bg-neutral-800 border-purple-600" : "bg-neutral-800/40 border-neutral-700 hover:bg-neutral-800"}`}
            aria-pressed={isActive(id)}
          >
            <div className="flex items-center gap-3">
              <img src={avatar} alt="" className="w-8 h-8 rounded-md object-cover" />
              <div className="flex flex-col">
                <span className="text-white text-sm">{name}</span>
                <span className="text-xs text-neutral-400">{sub}</span>
              </div>
            </div>
            <span
              className={`inline-block w-4 h-4 rounded-full border ${
                isActive(id) ? "bg-purple-600 border-purple-600" : "border-neutral-600"
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
