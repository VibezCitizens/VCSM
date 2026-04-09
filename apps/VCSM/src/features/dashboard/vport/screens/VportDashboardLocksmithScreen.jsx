// src/features/dashboard/vport/screens/VportDashboardLocksmithScreen.jsx
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Plus, Trash2, X, Wrench, AlertTriangle, Clock, DollarSign, Shield, Truck } from "lucide-react";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";

import { useLocksmithProfile } from "@/features/profiles/kinds/vport/hooks/locksmith/useLocksmithProfile";
import { useLocksmithOwner } from "@/features/profiles/kinds/vport/hooks/locksmith/useLocksmithOwner";

// ── Service Area Form ──
function AreaForm({ initial, onSave, onCancel, saving }) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [stateCode, setStateCode] = useState(initial?.stateCode ?? "");
  const [zipCode, setZipCode] = useState(initial?.zipCode ?? "");
  const [radiusMiles, setRadiusMiles] = useState(initial?.radiusMiles ?? "");
  const [minEta, setMinEta] = useState(initial?.minEtaMinutes ?? "");
  const [maxEta, setMaxEta] = useState(initial?.maxEtaMinutes ?? "");
  const [travelFee, setTravelFee] = useState(initial?.travelFeeCents ? (initial.travelFeeCents / 100).toFixed(2) : "");
  const [emergency, setEmergency] = useState(initial?.isEmergencyCovered ?? true);

  const handleSubmit = () => {
    const areaType = zipCode ? "zip" : radiusMiles ? "radius" : "city";
    onSave({
      label: label.trim() || city.trim() || "Coverage area",
      areaType,
      city: city.trim() || null,
      stateCode: stateCode.trim().toUpperCase() || null,
      zipCode: zipCode.trim() || null,
      radiusMiles: radiusMiles ? parseFloat(radiusMiles) : null,
      minEtaMinutes: minEta ? parseInt(minEta, 10) : null,
      maxEtaMinutes: maxEta ? parseInt(maxEta, 10) : null,
      travelFeeCents: travelFee ? Math.round(parseFloat(travelFee) * 100) : 0,
      isEmergencyCovered: emergency,
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">{initial ? "Edit Area" : "Add Service Area"}</div>
        <button type="button" onClick={onCancel} className="text-white/40 hover:text-white/70"><X size={16} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Label (e.g. Downtown)" value={label} onChange={(e) => setLabel(e.target.value)}
          className="col-span-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)}
          className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
        <input placeholder="State (e.g. FL)" value={stateCode} onChange={(e) => setStateCode(e.target.value)} maxLength={2}
          className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
        <input placeholder="ZIP code" value={zipCode} onChange={(e) => setZipCode(e.target.value)}
          className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
        <input placeholder="Radius (miles)" value={radiusMiles} onChange={(e) => setRadiusMiles(e.target.value)} type="number"
          className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input placeholder="Min ETA (min)" value={minEta} onChange={(e) => setMinEta(e.target.value)} type="number"
          className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
        <input placeholder="Max ETA (min)" value={maxEta} onChange={(e) => setMaxEta(e.target.value)} type="number"
          className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
        <input placeholder="Travel fee ($)" value={travelFee} onChange={(e) => setTravelFee(e.target.value)} type="number" step="0.01"
          className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-black/30 accent-red-400" />
        <span className="text-sm text-white/70">Emergency service available in this area</span>
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10">Cancel</button>
        <button type="button" disabled={saving} onClick={handleSubmit}
          className="rounded-full border border-sky-300/40 bg-sky-300/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-300/22 disabled:opacity-50">
          {saving ? "Saving..." : initial ? "Update" : "Add Area"}
        </button>
      </div>
    </div>
  );
}

// ── Service Area Card ──
function AreaCard({ area, onEdit, onDelete, deleting }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="shrink-0 text-white/40" />
          <span className="text-sm font-medium text-white truncate">{area.label || area.city || "Area"}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-white/40">
          {area.city && area.stateCode ? <span>{area.city}, {area.stateCode}</span> : null}
          {area.zipCode ? <span>ZIP {area.zipCode}</span> : null}
          {area.radiusMiles ? <span>{area.radiusMiles} mi</span> : null}
          {area.minEtaMinutes != null ? <span>ETA {area.minEtaMinutes}–{area.maxEtaMinutes ?? "?"} min</span> : null}
          {area.isEmergencyCovered ? <span className="text-red-300/60">Emergency</span> : null}
          {area.travelFeeCents > 0 ? <span>+${(area.travelFeeCents / 100).toFixed(2)}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button type="button" onClick={() => onEdit(area)} className="grid h-7 w-7 place-items-center rounded-lg border border-white/8 text-white/40 hover:text-white/70"><Wrench size={12} /></button>
        <button type="button" disabled={deleting} onClick={() => onDelete(area.id)} className="grid h-7 w-7 place-items-center rounded-lg border border-red-400/20 text-red-300/50 hover:text-red-300 disabled:opacity-50"><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

// ── Service Detail Row ──
function ServiceDetailRow({ detail }) {
  const parts = [];
  if (detail.serviceFamily) parts.push(detail.serviceFamily);
  if (detail.isEmergency) parts.push("Emergency");
  if (detail.isMobileService) parts.push("Mobile");
  if (detail.isAfterHoursAvailable) parts.push("After-hours");
  if (detail.pricingModel === "starting_at" && detail.startingPriceCents != null) parts.push(`From $${(detail.startingPriceCents / 100).toFixed(0)}`);
  if (detail.pricingModel === "quote") parts.push("Quote");
  if (detail.warrantyDays) parts.push(`${detail.warrantyDays}d warranty`);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2">
      <Wrench size={12} className="shrink-0 text-white/30" />
      <span className="text-xs text-white/50 capitalize">{detail.serviceKind?.replace(/_/g, " ") ?? "Service"}</span>
      {parts.length ? <span className="text-[10px] text-white/30">· {parts.join(" · ")}</span> : null}
    </div>
  );
}

// ── Main Screen ──
export default function VportDashboardLocksmithScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity } = useIdentity();
  const targetActorId = params?.actorId ?? null;
  const viewerActorId = identity?.actorId ?? null;
  const isDesktop = useDesktopBreakpoint();
  const isOwner = Boolean(targetActorId) && Boolean(viewerActorId) && String(viewerActorId) === String(targetActorId);

  const { serviceAreas, serviceDetails, loading, reload } = useLocksmithProfile(targetActorId, "locksmith");
  const owner = useLocksmithOwner(targetActorId, { onSuccess: reload });

  const [showAddArea, setShowAddArea] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [deletingAreaId, setDeletingAreaId] = useState(null);

  const handleAddArea = useCallback(async (area) => {
    await owner.addArea(area);
    setShowAddArea(false);
  }, [owner]);

  const handleUpdateArea = useCallback(async (area) => {
    if (!editingArea?.id) return;
    await owner.updateArea(editingArea.id, area);
    setEditingArea(null);
  }, [owner, editingArea]);

  const handleDeleteArea = useCallback(async (areaId) => {
    setDeletingAreaId(areaId);
    try {
      await owner.deleteArea(areaId);
    } finally {
      setDeletingAreaId(null);
    }
  }, [owner]);

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 900 });

  if (!targetActorId) return null;
  if (!isOwner) return <div className="p-10 text-center text-neutral-400">Owner access only.</div>;

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={() => navigate(`/actor/${targetActorId}/dashboard`)} style={shell.btn("soft")} />
            <div style={shell.title}>LOCKSMITH</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }}>

            {/* ── Service Areas Section ── */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2"><MapPin size={15} /> Service Areas</div>
                  <div className="mt-0.5 text-xs text-white/40">Where you provide locksmith services</div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-6 justify-center text-sm text-white/40">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  Loading...
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceAreas.map((area) => (
                    editingArea?.id === area.id ? (
                      <AreaForm key={area.id} initial={area} onSave={handleUpdateArea} onCancel={() => setEditingArea(null)} saving={owner.saving} />
                    ) : (
                      <AreaCard key={area.id} area={area} onEdit={setEditingArea} onDelete={handleDeleteArea} deleting={deletingAreaId === area.id} />
                    )
                  ))}

                  {!serviceAreas.length && !showAddArea ? (
                    <div className="rounded-xl border border-white/6 bg-white/[0.02] py-6 text-center text-sm text-white/30">
                      No service areas configured yet.
                    </div>
                  ) : null}

                  {showAddArea ? (
                    <AreaForm onSave={handleAddArea} onCancel={() => setShowAddArea(false)} saving={owner.saving} />
                  ) : (
                    <button type="button" onClick={() => setShowAddArea(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-3 text-sm text-white/40 hover:border-sky-300/30 hover:text-sky-200/70 transition-colors">
                      <Plus size={16} /> Add service area
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Service Details Section ── */}
            <div className="mb-6">
              <div className="mb-3">
                <div className="text-sm font-semibold text-white flex items-center gap-2"><Wrench size={15} /> Service Details</div>
                <div className="mt-0.5 text-xs text-white/40">Locksmith-specific metadata for your services</div>
              </div>

              {serviceDetails.length ? (
                <div className="space-y-1.5">
                  {serviceDetails.map((d) => (
                    <ServiceDetailRow key={d.serviceId} detail={d} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/6 bg-white/[0.02] py-6 text-center text-sm text-white/30">
                  No locksmith service details configured. Add them via the Services editor after attaching services to your profile.
                </div>
              )}
            </div>

            {/* ── Quick Info ── */}
            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
              <div className="text-xs font-medium text-white/40 mb-2">Quick Summary</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-white">{serviceAreas.length}</div>
                  <div className="text-[10px] text-white/35">Areas</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{serviceDetails.length}</div>
                  <div className="text-[10px] text-white/35">Services</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{serviceAreas.filter((a) => a.isEmergencyCovered).length}</div>
                  <div className="text-[10px] text-white/35">Emergency</div>
                </div>
              </div>
            </div>

            {owner.error ? (
              <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                {String(owner.error?.message ?? owner.error)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>{content}</div>,
      document.body,
    );
  }

  return content;
}
