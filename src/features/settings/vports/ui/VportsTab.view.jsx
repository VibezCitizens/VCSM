// src/features/settings/vports/ui/VportsTab.view.jsx
import { Plus, X } from "lucide-react";

import Card from '@/features/settings/ui/Card'
import CreateVportForm from "@/features/vport/CreateVportForm.jsx";
import OnemoredaysAd from "@/features/ads/widgets/OnemoredaysAd";

import { useVportsController } from "../controller/Vports.controller";

export default function VportsTabView() {
  const {
    items,
    setItems,
    busy,
    setBusy,
    showCreator,
    setShowCreator,
    activeActor,
    profileActorId,
    switchToProfile,
    switchToVport,
  } = useVportsController();

  return (
    <div className="space-y-5">

      {/* ================= PROFILE ================= */}
      <Card className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl">
        <div className="mb-3 text-sm font-semibold text-white/90">
          Your Profile
        </div>

        <button
          onClick={() => switchToProfile(profileActorId, setBusy)}
          disabled={busy || activeActor === "profile"}
          className={[
            "w-full text-left px-4 py-3 rounded-xl transition",
            "border flex items-center justify-between",
            activeActor === "profile"
              ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-500"
              : "bg-neutral-900/70 text-neutral-200 border-neutral-800 hover:bg-neutral-800",
            busy && "opacity-60 cursor-wait",
          ].join(" ")}
        >
          <span className="font-medium">
            {activeActor === "profile"
              ? "Current Profile"
              : "Switch to My Profile"}
          </span>

          <span className="text-[10px] px-2 py-0.5 rounded-md uppercase bg-white/10">
            Profile
          </span>
        </button>
      </Card>

      {/* ================= VPORTS ================= */}
      <Card className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white/90">
            Your VPORTs
          </div>

          <button
            onClick={() => setShowCreator(true)}
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5
                       rounded-lg border bg-neutral-900/80 text-neutral-100
                       border-neutral-800 hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Create VPORT
          </button>
        </div>

        {!items.length ? (
          <div className="text-sm text-neutral-400 bg-neutral-900/60
                          border border-neutral-800 rounded-xl px-4 py-3">
            You don’t own any VPORTs yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {items.map((v) => {
              const isActive = activeActor === `vport:${v.id}`;

              return (
                <li
                  key={v.id}
                  className="flex items-center justify-between
                             rounded-xl border px-3 py-2.5
                             bg-neutral-900/60 border-neutral-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={v.avatar_url || "/avatar.jpg"}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover
                                 border border-neutral-700/70"
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">
                        {v.name}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => switchToVport(v, setBusy)}
                    disabled={busy || isActive}
                    className={[
                      "text-xs px-3 py-1.5 rounded-lg border",
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-500"
                        : "bg-neutral-900/80 text-neutral-200 border-neutral-800 hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    {isActive ? "Current" : "Switch"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ================= SPONSORED ================= */}
      <OnemoredaysAd />

      {/* ================= CREATE MODAL ================= */}
      {showCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCreator(false)}
          />
          <div className="relative w-full max-w-[560px]
                          rounded-2xl border border-neutral-800 bg-neutral-950">
            <div className="flex items-center justify-between
                            px-4 py-3 border-b border-neutral-800">
              <div className="text-sm font-semibold text-white/90">
                Create a VPORT
              </div>
              <button
                onClick={() => setShowCreator(false)}
                className="p-1.5 rounded-md hover:bg-white/5 text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <CreateVportForm
                onCreated={(list) => {
                  setItems(list);
                  setShowCreator(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
