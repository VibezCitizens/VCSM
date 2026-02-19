import React, { useCallback, useMemo, useState } from "react";
import ImageDropzone from "./ImageDropzone";
import { uploadFlyerImage } from "../dal/flyer.upload.dal";
import { saveFlyerPublicDetails } from "../dal/flyer.write.dal";

export default function FlyerEditorPanel({
  vportId,
  draft,
  setDraft,
  bucket = "vport-public",
  onSaved,
} = {}) {
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");

  const setField = useCallback(
    (key, value) => {
      setDraft((prev) => ({ ...(prev || {}), [key]: value }));
    },
    [setDraft]
  );

  const hoursValue = useMemo(() => {
    const h = draft?.hours;
    return h && typeof h === "object" && !Array.isArray(h) ? h : {};
  }, [draft?.hours]);

  const setHoursDay = useCallback(
    (dayKey, patch) => {
      setDraft((prev) => {
        const prevHours =
          prev?.hours && typeof prev.hours === "object" && !Array.isArray(prev.hours)
            ? prev.hours
            : {};

        const nextDay = { ...(prevHours?.[dayKey] || {}), ...(patch || {}) };
        const nextHours = { ...prevHours, [dayKey]: nextDay };

        return { ...(prev || {}), hours: nextHours };
      });
    },
    [setDraft]
  );

  const input = useMemo(
    () => ({
      width: "100%",
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      outline: "none",
      fontWeight: 800,
      fontSize: 13,
    }),
    []
  );

  const label = useMemo(
    () => ({ fontSize: 12, fontWeight: 950, opacity: 0.8 }),
    []
  );

  const card = useMemo(
    () => ({
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(10,12,22,0.55)",
      padding: 14,
      display: "grid",
      gap: 12,
    }),
    []
  );

  const uploadAndSet = useCallback(
    async (kind, fieldKey, file) => {
      if (!vportId) return;
      setUploadingKey(fieldKey);
      try {
        const url = await uploadFlyerImage({ bucket, vportId, file, kind });
        if (url) setField(fieldKey, url);
      } finally {
        setUploadingKey("");
      }
    },
    [bucket, vportId, setField]
  );

  const onSave = useCallback(async () => {
    if (!vportId) return;
    setSaving(true);
    try {
      const res = await saveFlyerPublicDetails({ vportId, patch: draft });
      onSaved?.(res);
    } finally {
      setSaving(false);
    }
  }, [vportId, draft, onSaved]);

  const days = useMemo(
    () => [
      { key: "mon", label: "Mon" },
      { key: "tue", label: "Tue" },
      { key: "wed", label: "Wed" },
      { key: "thu", label: "Thu" },
      { key: "fri", label: "Fri" },
      { key: "sat", label: "Sat" },
      { key: "sun", label: "Sun" },
    ],
    []
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={card}>
        <div style={{ fontWeight: 950, letterSpacing: 0.6 }}>Flyer Content</div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={label}>Headline</div>
          <input
            style={input}
            value={draft.flyer_headline || ""}
            onChange={(e) => setField("flyer_headline", e.target.value)}
            placeholder="ONLINE MENU"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={label}>Subheadline</div>
          <input
            style={input}
            value={draft.flyer_subheadline || ""}
            onChange={(e) => setField("flyer_subheadline", e.target.value)}
            placeholder="SCAN HERE TO VIEW OUR MENU ONLINE"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={label}>Note</div>
          <textarea
            style={{ ...input, minHeight: 84, resize: "vertical" }}
            value={draft.flyer_note || ""}
            onChange={(e) => setField("flyer_note", e.target.value)}
            placeholder="Fresh meals, fast service, good vibes."
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={label}>Hours</div>

            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                padding: 10,
                display: "grid",
                gap: 10,
              }}
            >
              {days.map((d) => {
                const day = hoursValue?.[d.key] || {};
                const closed = !!day.closed;
                const open = typeof day.open === "string" ? day.open : "";
                const close = typeof day.close === "string" ? day.close : "";

                return (
                  <div
                    key={d.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "64px 1fr 1fr 92px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.85 }}>
                      {d.label}
                    </div>

                    <input
                      type="time"
                      style={{ ...input, padding: "8px 10px", fontWeight: 900 }}
                      value={open}
                      disabled={closed}
                      onChange={(e) => setHoursDay(d.key, { open: e.target.value })}
                    />

                    <input
                      type="time"
                      style={{ ...input, padding: "8px 10px", fontWeight: 900 }}
                      value={close}
                      disabled={closed}
                      onChange={(e) => setHoursDay(d.key, { close: e.target.value })}
                    />

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 900,
                        opacity: 0.9,
                        cursor: "pointer",
                        userSelect: "none",
                        justifyContent: "flex-end",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={closed}
                        onChange={(e) => {
                          const nextClosed = e.target.checked;
                          setHoursDay(d.key, {
                            closed: nextClosed,
                            ...(nextClosed ? { open: "", close: "" } : {}),
                          });
                        }}
                      />
                      Closed
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={label}>Accent</div>
            <input
              type="color"
              value={(draft.accent_color || "#c23a3a").trim()}
              onChange={(e) => setField("accent_color", e.target.value)}
              style={{
                width: "100%",
                height: 40,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={label}>Phone</div>
            <input
              style={input}
              value={draft.phone_public || ""}
              onChange={(e) => setField("phone_public", e.target.value)}
              placeholder="+1 (555) 555-5555"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={label}>Website</div>
            <input
              style={input}
              value={draft.website_url || ""}
              onChange={(e) => setField("website_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 950, letterSpacing: 0.6 }}>Images</div>

        <ImageDropzone
          label={uploadingKey === "logo_url" ? "Logo (uploading…)" : "Logo"}
          value={draft.logo_url || ""}
          onPickFile={(file) => uploadAndSet("logo", "logo_url", file)}
          onClear={() => setField("logo_url", "")}
        />

        <ImageDropzone
          label={
            uploadingKey === "flyer_food_image_1" ? "Food 1 (uploading…)" : "Food 1"
          }
          value={draft.flyer_food_image_1 || ""}
          onPickFile={(file) => uploadAndSet("food1", "flyer_food_image_1", file)}
          onClear={() => setField("flyer_food_image_1", "")}
        />

        <ImageDropzone
          label={
            uploadingKey === "flyer_food_image_2" ? "Food 2 (uploading…)" : "Food 2"
          }
          value={draft.flyer_food_image_2 || ""}
          onPickFile={(file) => uploadAndSet("food2", "flyer_food_image_2", file)}
          onClear={() => setField("flyer_food_image_2", "")}
        />

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            padding: "12px 12px",
            borderRadius: 14,
            border: "1px solid rgba(0,255,240,0.22)",
            background:
              "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
            color: "#fff",
            fontWeight: 950,
            letterSpacing: 0.3,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.75 : 1,
          }}
        >
          {saving ? "Saving…" : "Save Flyer"}
        </button>
      </div>
    </div>
  );
}
