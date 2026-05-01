import { useState } from "react";
import { MapPin, Trash2, X, Wrench } from "lucide-react";
import { ConsentCheckbox } from "@/features/auth/adapters/auth.adapter";

const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],
  ["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
  ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],
  ["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
  ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
  ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
  ["DC","D.C."],["PR","Puerto Rico"],
];

const fieldCls = "rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20";
const selectCls = `${fieldCls} appearance-none`;

export function AreaForm({ initial, onSave, onCancel, saving }) {
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
      stateCode: stateCode || null,
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
          className={`col-span-2 ${fieldCls}`} />
        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)}
          className={fieldCls} />
        <select value={stateCode} onChange={(e) => setStateCode(e.target.value)} className={selectCls}>
          <option value="">State</option>
          {US_STATES.map(([code, name]) => (
            <option key={code} value={code}>{code} — {name}</option>
          ))}
        </select>
        <input placeholder="ZIP code" value={zipCode} onChange={(e) => setZipCode(e.target.value)}
          className={fieldCls} />
        <input placeholder="Radius (miles)" value={radiusMiles} onChange={(e) => setRadiusMiles(e.target.value)} type="number"
          className={fieldCls} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input placeholder="Min ETA (min)" value={minEta} onChange={(e) => setMinEta(e.target.value)} type="number"
          className={fieldCls} />
        <input placeholder="Max ETA (min)" value={maxEta} onChange={(e) => setMaxEta(e.target.value)} type="number"
          className={fieldCls} />
        <input placeholder="Travel fee ($)" value={travelFee} onChange={(e) => setTravelFee(e.target.value)} type="number" step="0.01"
          className={fieldCls} />
      </div>

      <ConsentCheckbox checked={emergency} onChange={() => setEmergency((v) => !v)}>
        Emergency service available in this area
      </ConsentCheckbox>

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

export function AreaCard({ area, onEdit, onDelete, deleting }) {
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

export function ServiceDetailRow({ detail }) {
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

export function GapServiceRow({ service }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2">
      <Wrench size={12} className="shrink-0 text-amber-300/50" />
      <span className="text-xs text-white/50">{service.label ?? service.key}</span>
      <span className="text-[10px] text-amber-300/60">· Needs configuration</span>
    </div>
  );
}
