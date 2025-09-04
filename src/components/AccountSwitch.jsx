// src/components/AccountSwitch.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/state/identityContext";
import toast from "react-hot-toast";

export default function AccountSwitch() {
  const { identity, actAsUser, actAsVport, isVport } = useIdentity();
  const [vports, setVports] = useState([]);
  const [loading, setLoading] = useState(false);

  // replace the entire useEffect with this
useEffect(() => {
  let cancel = false;
  (async () => {
    if (!identity?.userId) return;
    setLoading(true);

    // Fetch VPORTs you own (no managers table anymore)
    const { data, error } = await supabase
      .from('vports')
      .select('id, name, avatar_url')
      .eq('created_by', identity.userId)
      .order('created_at', { ascending: false });

    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }
    if (!cancel) {
      setVports(
        (data || []).map(v => ({
          id: v.id,
          role: 'owner',                 // static label now
          name: v.name || 'VPORT',
          avatar: v.avatar_url || '/avatar.jpg',
        }))
      );
    }
  })();
  return () => { cancel = true; };
}, [identity?.userId]);


  const currentLabel = isVport ? "Acting as VPORT" : "Acting as You";

  return (
    <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-white space-y-3">
      <div className="text-sm text-neutral-400">{currentLabel}</div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            const ok = actAsUser();
            if (!ok) toast.error("Couldn't switch to your account.");
            else toast.success("Switched to your account");
          }}
          className={`px-3 py-1 rounded-lg text-sm border ${identity?.type === "user" ? "bg-purple-600 border-purple-600" : "border-neutral-700 hover:bg-neutral-800"}`}
        >
          Your Account
        </button>

        {loading && <span className="text-neutral-400 text-sm">Loading VPORTs…</span>}

        {vports.map(v => {
          const active = identity?.type === "vport" && identity?.vportId === v.id;
          return (
            <button
              key={v.id}
              onClick={() => {
                const ok = actAsVport(v.id);
                if (!ok) toast.error("You do not have permission to act as this VPORT.");
                else toast.success(`Switched to ${v.name}`);
              }}
              className={`px-3 py-1 rounded-lg text-sm border ${
                active ? "bg-purple-600 border-purple-600" : "border-neutral-700 hover:bg-neutral-800"
              }`}
              title={`Role: ${v.role}`}
            >
              {v.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
