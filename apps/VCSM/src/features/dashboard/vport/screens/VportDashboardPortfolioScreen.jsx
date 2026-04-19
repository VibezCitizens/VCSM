// src/features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon, Plus, Trash2, X, Sparkles, Tag, Bug } from "lucide-react";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";

import { createItem, addMedia, deleteItem, manageTags } from "@portfolio";
import { portfolioTraceStore } from "@/features/portfolio/setup";
import { useVportPortfolio } from "@/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio";
import { ctrlSavePortfolioDetail } from "@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller";
import { uploadToCloudflare } from "@/services/cloudflare/uploadToCloudflare";
import { compressIfNeeded } from "@/features/upload/lib/compressIfNeeded";
import { buildR2Key } from "@/services/cloudflare/buildR2Key";
import { supabase } from "@/services/supabase/supabaseClient";

// ── BugsBunny: Portfolio Create Diagnostic Panel (DEV only) ──
function PortfolioBugsBunnyPanel({ actorId, identity }) {
  const [open, setOpen] = useState(false);
  const [probe, setProbe] = useState(null);
  const [probing, setProbing] = useState(false);
  const [traceEvents, setTraceEvents] = useState([]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const unsub = portfolioTraceStore.subscribe(setTraceEvents);
    setTraceEvents(portfolioTraceStore.events);
    return unsub;
  }, []);

  const runProbe = useCallback(async () => {
    if (!actorId) return;
    setProbing(true);
    setProbe(null);
    const result = {};
    try {
      // 1. Identity snapshot
      result.identity = {
        actorId: identity?.actorId ?? null,
        kind: identity?.kind ?? null,
        vportType: identity?.vportType ?? null,
        ownerActorId: identity?.ownerActorId ?? null,
      };

      // 2. Resolve profile_id from vport.profiles
      const { data: profileRow, error: profileErr } = await supabase
        .schema("vport")
        .from("profiles")
        .select("id, actor_id, name, slug, is_active, is_deleted")
        .eq("actor_id", actorId)
        .limit(1);

      result.profileLookup = {
        actorId,
        row: profileRow?.[0] ?? null,
        error: profileErr?.message ?? null,
      };

      const profileId = profileRow?.[0]?.id ?? null;
      result.resolvedProfileId = profileId;

      // 3. Check profile_actor_access
      if (profileId) {
        const { data: accessRows, error: accessErr } = await supabase
          .schema("vport")
          .from("profile_actor_access")
          .select("actor_id, role, status, is_primary")
          .eq("profile_id", profileId);

        result.profileActorAccess = {
          rows: accessRows ?? [],
          error: accessErr?.message ?? null,
          activeActorFound: (accessRows ?? []).some(
            (r) => r.actor_id === actorId
          ),
        };
      } else {
        result.profileActorAccess = null;
      }

      // 4. Check actor_owners for the vport actor
      const { data: ownerRows, error: ownerErr } = await supabase
        .schema("vc")
        .from("actor_owners")
        .select("actor_id, user_id")
        .eq("actor_id", actorId);

      result.actorOwners = {
        rows: ownerRows ?? [],
        error: ownerErr?.message ?? null,
      };

      // 5. Supabase auth session
      const { data: { session } } = await supabase.auth.getSession();
      result.session = {
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
      };

      // 6. Expected insert payload
      result.expectedInsertPayload = {
        profile_id: profileId,
        created_by_actor_id: null,
        title: "(test title)",
        portfolio_kind: "work",
        visibility: "public",
      };

      // 7. Assertions
      const assertions = [];
      if (!actorId) assertions.push({ label: "actorId present", pass: false });
      else assertions.push({ label: "actorId present", pass: true, value: actorId });

      if (identity?.kind !== "vport")
        assertions.push({ label: "identity.kind === vport", pass: false, value: identity?.kind });
      else assertions.push({ label: "identity.kind === vport", pass: true });

      if (!profileId)
        assertions.push({ label: "profileId resolved", pass: false, value: "NO PROFILE FOUND for actor" });
      else assertions.push({ label: "profileId resolved", pass: true, value: profileId });

      if (profileId && profileRow?.[0]?.actor_id !== actorId)
        assertions.push({ label: "profile.actor_id matches actorId", pass: false, got: profileRow?.[0]?.actor_id });
      else if (profileId)
        assertions.push({ label: "profile.actor_id matches actorId", pass: true });

      if (profileRow?.[0]?.is_deleted)
        assertions.push({ label: "profile not deleted", pass: false });
      else if (profileId)
        assertions.push({ label: "profile not deleted", pass: true });

      result.assertions = assertions;
    } catch (e) {
      result.probeError = e?.message ?? String(e);
    }
    setProbe(result);
    setProbing(false);
  }, [actorId, identity]);

  if (!import.meta.env.DEV) return null;

  return (
    <div style={{ margin: "0 0 12px 0" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 10,
          border: "1px solid rgba(250,200,50,0.3)",
          background: "rgba(250,200,50,0.08)",
          color: "rgba(250,200,50,0.9)", fontSize: 11,
          fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em",
          fontFamily: "monospace",
        }}
      >
        <Bug size={13} />
        BUGSBUNNY — Portfolio Diagnostic {open ? "▲" : "▼"}
      </button>

      {open && (
        <div style={{
          marginTop: 6, borderRadius: 12,
          border: "1px solid rgba(250,200,50,0.2)",
          background: "rgba(0,0,0,0.6)", padding: 12,
          fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.7)",
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              onClick={runProbe}
              disabled={probing}
              style={{
                padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                border: "1px solid rgba(100,220,100,0.4)",
                background: "rgba(100,220,100,0.1)", color: "rgba(150,255,150,0.9)",
                fontSize: 11, fontWeight: 600,
              }}
            >
              {probing ? "Probing..." : "▶ Run Probe"}
            </button>
            <button
              type="button"
              onClick={() => { portfolioTraceStore.clear(); setTraceEvents([]); }}
              style={{
                padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "rgba(255,255,255,0.4)",
                fontSize: 11,
              }}
            >
              Clear Trace
            </button>
          </div>

          {/* Probe results */}
          {probe && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "rgba(250,200,50,0.8)", marginBottom: 6, fontWeight: 700 }}>
                — PROBE RESULTS —
              </div>

              {/* Assertions */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>ASSERTIONS</div>
                {(probe.assertions ?? []).map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 2 }}>
                    <span style={{ color: a.pass ? "rgba(100,255,100,0.9)" : "rgba(255,80,80,0.9)", minWidth: 16 }}>
                      {a.pass ? "✓" : "✗"}
                    </span>
                    <span style={{ color: a.pass ? "rgba(200,255,200,0.7)" : "rgba(255,180,180,0.9)" }}>
                      {a.label}
                    </span>
                    {a.value !== undefined && (
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>
                        {typeof a.value === "string" ? a.value : JSON.stringify(a.value)}
                      </span>
                    )}
                    {a.got !== undefined && (
                      <span style={{ color: "rgba(255,100,100,0.7)" }}>
                        got: {JSON.stringify(a.got)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Identity */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>IDENTITY</div>
                <pre style={{ margin: 0, color: "rgba(200,220,255,0.75)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(probe.identity, null, 2)}
                </pre>
              </div>

              {/* Profile lookup */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>PROFILE LOOKUP (vport.profiles)</div>
                <pre style={{ margin: 0, color: probe.profileLookup?.row ? "rgba(200,220,255,0.75)" : "rgba(255,150,150,0.8)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(probe.profileLookup, null, 2)}
                </pre>
              </div>

              {/* profile_actor_access */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>PROFILE_ACTOR_ACCESS</div>
                <pre style={{ margin: 0, color: probe.profileActorAccess?.activeActorFound ? "rgba(200,255,200,0.75)" : "rgba(255,150,150,0.8)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(probe.profileActorAccess, null, 2)}
                </pre>
              </div>

              {/* actor_owners */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>ACTOR_OWNERS (vc.actor_owners)</div>
                <pre style={{ margin: 0, color: "rgba(200,220,255,0.75)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(probe.actorOwners, null, 2)}
                </pre>
              </div>

              {/* session */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>AUTH SESSION</div>
                <pre style={{ margin: 0, color: "rgba(200,220,255,0.75)", whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(probe.session, null, 2)}
                </pre>
              </div>

              {/* expected payload */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>EXPECTED INSERT PAYLOAD</div>
                <pre style={{ margin: 0, color: "rgba(255,230,150,0.8)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {JSON.stringify(probe.expectedInsertPayload, null, 2)}
                </pre>
              </div>

              {probe.probeError && (
                <div style={{ color: "rgba(255,80,80,0.9)" }}>
                  PROBE ERROR: {probe.probeError}
                </div>
              )}
            </div>
          )}

          {/* Engine trace events */}
          {traceEvents.length > 0 && (
            <div>
              <div style={{ color: "rgba(250,200,50,0.8)", marginBottom: 6, fontWeight: 700 }}>
                — ENGINE TRACE ({traceEvents.length}) —
              </div>
              {traceEvents.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 4, padding: "4px 8px", borderRadius: 6,
                    background: ev.step?.includes("ERROR") || ev.step?.includes("FAIL")
                      ? "rgba(255,80,80,0.1)"
                      : "rgba(255,255,255,0.03)",
                    borderLeft: `2px solid ${
                      ev.step?.includes("ERROR") || ev.step?.includes("FAIL")
                        ? "rgba(255,80,80,0.5)"
                        : ev.step?.includes("SUCCESS")
                        ? "rgba(100,255,100,0.4)"
                        : "rgba(255,255,255,0.1)"
                    }`,
                  }}
                >
                  <span style={{ color: "rgba(255,200,100,0.7)", marginRight: 6 }}>
                    {new Date(ev.ts).toISOString().slice(11, 23)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.8)", marginRight: 6 }}>
                    {ev.step}
                  </span>
                  {Object.entries(ev)
                    .filter(([k]) => k !== "step" && k !== "ts")
                    .map(([k, v]) => (
                      <span key={k} style={{ color: "rgba(180,220,255,0.6)", marginRight: 6 }}>
                        {k}={typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </span>
                    ))
                  }
                </div>
              ))}
            </div>
          )}

          {traceEvents.length === 0 && !probe && (
            <div style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
              No trace events yet. Run a probe or attempt a create to see engine trace output.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Upload helper ──
async function uploadPortfolioFile(file, actorId) {
  const prepared = await compressIfNeeded(file);
  const key = buildR2Key("portfolio", actorId, prepared);
  const { url, error } = await uploadToCloudflare(prepared, key);
  if (error || !url) throw new Error(error || "Upload failed");
  return url;
}

// ── Create form ──
function CreateItemForm({ actorId, vportType, onCreated, onCancel }) {
  const isLocksmith = String(vportType ?? "").toLowerCase() === "locksmith";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("work");
  const [tagsInput, setTagsInput] = useState("");

  // Locksmith-specific fields
  const [jobType, setJobType] = useState("other");
  const [propertyType, setPropertyType] = useState("");
  const [lockType, setLockType] = useState("");
  const [hardwareBrand, setHardwareBrand] = useState("");
  const [serviceMode, setServiceMode] = useState("");
  const [isEmergencyJob, setIsEmergencyJob] = useState(false);
  const [isSecurityUpgrade, setIsSecurityUpgrade] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleFiles = useCallback((e) => {
    const selected = Array.from(e.target.files || []).slice(0, 10);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  }, []);

  const removeFile = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!files.length) {
      setError(new Error("Add at least one photo."));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 48);

      const item = await createItem({
        actorId,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        portfolioKind: kind,
        tags: tags.length ? tags : undefined,
      });

      // Upload files as media
      const uploadedMedia = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadPortfolioFile(file, actorId);
        const mediaRole = kind === "before_after" && i === 0
          ? "before"
          : kind === "before_after" && i === 1
            ? "after"
            : i === 0
              ? "cover"
              : "result";

        await addMedia({
          itemId: item.id,
          actorId,
          url,
          mediaType: "image",
          mediaRole,
          sortOrder: i,
        });
        uploadedMedia.push({ url, type: "image", role: mediaRole, sortOrder: i });
      }

      // Save locksmith-specific details if applicable
      if (isLocksmith) {
        await ctrlSavePortfolioDetail(item.id, {
          jobType: jobType || "other",
          propertyType: propertyType || null,
          lockType: lockType.trim() || null,
          hardwareBrand: hardwareBrand.trim() || null,
          serviceMode: serviceMode || null,
          hasBeforeAfter: kind === "before_after",
          isEmergencyJob,
          isSecurityUpgrade,
          estimatedDurationMinutes: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
        });
      }

      // Clean up previews
      previews.forEach(URL.revokeObjectURL);

      const optimisticItem = {
        id: item.id,
        title: item.title ?? null,
        portfolioKind: kind,
        tags: item.tags ?? [],
        coverUrl: uploadedMedia[0]?.url ?? null,
        media: uploadedMedia,
        mediaCount: uploadedMedia.length,
      };
      onCreated?.(optimisticItem);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }, [actorId, files, title, description, kind, tagsInput, previews, onCreated]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-base font-semibold text-white">New Portfolio Item</div>
        <button type="button" onClick={onCancel} className="text-white/40 hover:text-white/70">
          <X size={18} />
        </button>
      </div>

      {/* Kind selector */}
      <div className="mb-4 flex gap-2">
        {[
          { value: "work", label: "Work Sample" },
          { value: "before_after", label: "Before & After" },
          { value: "style_card", label: "Style Card" },
          { value: "space", label: "Space / Setup" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setKind(opt.value)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              kind === opt.value
                ? "border-sky-300/40 bg-sky-300/12 text-sky-100"
                : "border-white/8 bg-white/[0.03] text-white/40 hover:text-white/60",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        className="mb-3 w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
      />

      {/* Description */}
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="mb-3 w-full resize-none rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
      />

      {/* Tags */}
      <div className="mb-3 flex items-center gap-2">
        <Tag size={14} className="shrink-0 text-white/30" />
        <input
          type="text"
          placeholder="Tags (comma separated — e.g. fade, lineup, beard)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
        />
      </div>

      {/* Locksmith-specific fields */}
      {isLocksmith ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-white/35">Locksmith Details</div>
          <div className="grid grid-cols-2 gap-3">
            <select value={jobType} onChange={(e) => setJobType(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">
              <option value="other">Job Type</option>
              <option value="lockout">Lockout</option>
              <option value="rekey">Rekey</option>
              <option value="lock_change">Lock Change</option>
              <option value="new_install">New Install</option>
              <option value="repair">Repair</option>
              <option value="smart_lock">Smart Lock</option>
              <option value="safe">Safe</option>
              <option value="car_key">Car Key</option>
              <option value="commercial_hardware">Commercial Hardware</option>
              <option value="security_upgrade">Security Upgrade</option>
            </select>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">
              <option value="">Property Type</option>
              <option value="residential">Residential</option>
              <option value="automotive">Automotive</option>
              <option value="commercial">Commercial</option>
              <option value="safe">Safe / Vault</option>
            </select>
            <input placeholder="Lock type (e.g. deadbolt)" value={lockType} onChange={(e) => setLockType(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
            <input placeholder="Hardware brand" value={hardwareBrand} onChange={(e) => setHardwareBrand(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
            <select value={serviceMode} onChange={(e) => setServiceMode(e.target.value)}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">
              <option value="">Service Mode</option>
              <option value="mobile">Mobile</option>
              <option value="shop">Shop</option>
              <option value="onsite_emergency">Onsite Emergency</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <input placeholder="Duration (minutes)" value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} type="number"
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none" />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isEmergencyJob} onChange={(e) => setIsEmergencyJob(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/30 accent-red-400" />
              <span className="text-xs text-white/60">Emergency job</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isSecurityUpgrade} onChange={(e) => setIsSecurityUpgrade(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/30 accent-emerald-400" />
              <span className="text-xs text-white/60">Security upgrade</span>
            </label>
          </div>
        </div>
      ) : null}

      {/* Photo upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {previews.length ? (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-lg bg-black/60 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              {kind === "before_after" && i < 2 ? (
                <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">
                  {i === 0 ? "Before" : "After"}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-4 text-sm text-white/40 hover:border-white/25 hover:text-white/60 transition-colors"
      >
        <ImageIcon size={18} />
        {files.length ? `${files.length} photo${files.length > 1 ? "s" : ""} selected — tap to change` : "Tap to add photos"}
      </button>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
          {String(error?.message ?? error)}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || !files.length}
          onClick={handleSubmit}
          className={[
            "rounded-full px-5 py-2 text-sm font-semibold transition-all",
            saving
              ? "bg-white/8 text-white/30 cursor-wait"
              : !files.length
                ? "bg-white/5 text-white/25 cursor-not-allowed border border-white/8"
                : "border border-sky-300/40 bg-sky-300/15 text-sky-100 hover:bg-sky-300/22",
          ].join(" ")}
        >
          {saving ? "Uploading..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

// ── Item card (dashboard version) ──
function PortfolioManagerCard({ item, onDelete, deleting }) {
  const coverUrl = item?.coverUrl ?? item?.media?.[0]?.url ?? null;
  const isTransformation = item?.portfolioKind === "before_after";

  return (
    <div className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={20} className="text-white/15" />
          </div>
        )}
        {isTransformation ? (
          <span className="absolute top-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-amber-300">
            <Sparkles size={8} className="inline" /> B/A
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="truncate text-sm font-semibold text-white">
            {item.title || "Untitled"}
          </div>
          {item.tags?.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded bg-white/6 px-1.5 py-0.5 text-[10px] text-white/35">{t}</span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/25">
            {item.mediaCount ?? 0} photo{(item.mediaCount ?? 0) !== 1 ? "s" : ""}
          </span>
          {item.isFeatured ? (
            <span className="text-[10px] text-sky-300/60">Featured</span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        disabled={deleting}
        onClick={() => onDelete?.(item)}
        className="shrink-0 self-center grid h-8 w-8 place-items-center rounded-xl border border-red-400/20 bg-red-400/8 text-red-300/60 hover:bg-red-400/15 disabled:opacity-50 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Main screen ──
export default function VportDashboardPortfolioScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity } = useIdentity();
  const targetActorId = params?.actorId ?? null;
  const viewerActorId = identity?.actorId ?? null;
  const isDesktop = useDesktopBreakpoint();
  const isOwner = Boolean(targetActorId) && Boolean(viewerActorId) && String(viewerActorId) === String(targetActorId);

  const {
    allItems,
    loading,
    error,
    optimisticRemove,
    optimisticAdd,
  } = useVportPortfolio(targetActorId);

  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleCreated = useCallback((optimisticItem) => {
    setShowCreate(false);
    if (optimisticItem) optimisticAdd(optimisticItem);
  }, [optimisticAdd]);

  const handleDelete = useCallback(async (item) => {
    if (!item?.id || !targetActorId) return;
    setDeletingId(item.id);
    const rollback = optimisticRemove(item.id);
    try {
      await deleteItem({ itemId: item.id, actorId: targetActorId });
    } catch (_) {
      rollback();
    } finally {
      setDeletingId(null);
    }
  }, [targetActorId, optimisticRemove]);

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 900 });

  if (!targetActorId) return null;
  if (!isOwner) return <div className="p-10 text-center text-white/50">Owner access only.</div>;

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton
              isDesktop={isDesktop}
              onClick={() => navigate(`/actor/${targetActorId}/dashboard`)}
            />
            <div style={shell.title}>PORTFOLIO</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }}>
            {/* BugsBunny diagnostic panel — DEV only */}
            {import.meta.env.DEV && (
              <PortfolioBugsBunnyPanel actorId={targetActorId} identity={identity} />
            )}

            {/* Add button */}
            {!showCreate ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-4 text-sm font-medium text-white/50 hover:border-sky-300/30 hover:text-sky-200/70 transition-colors"
              >
                <Plus size={18} />
                Add portfolio item
              </button>
            ) : null}

            {/* Create form */}
            {showCreate ? (
              <div className="mb-4">
                <CreateItemForm
                  actorId={targetActorId}
                  vportType={identity?.vportType ?? null}
                  onCreated={handleCreated}
                  onCancel={() => setShowCreate(false)}
                />
              </div>
            ) : null}

            {/* Loading */}
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                <div className="text-sm text-white/40">Loading portfolio...</div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                {String(error?.message ?? error)}
              </div>
            ) : !allItems.length ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <ImageIcon size={32} className="text-white/15" />
                <div className="text-sm font-medium text-white/40">No portfolio items yet</div>
                <div className="text-xs text-white/25">Tap "Add portfolio item" above to showcase your work.</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mb-2 text-xs text-white/35">{allItems.length} item{allItems.length !== 1 ? "s" : ""}</div>
                {allItems.map((item) => (
                  <PortfolioManagerCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    deleting={deletingId === item.id}
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
      document.body,
    );
  }

  return content;
}
