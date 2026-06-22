import { useCallback, useMemo } from "react";
import ImageDropzone from "@/features/flyerBuilder/components/ImageDropzone";
import { useFlyerEditor } from "@/features/flyerBuilder/hooks/useFlyerEditor";
import { FlyerHoursTable } from "@/features/flyerBuilder/components/FlyerHoursTable";
import {
  card,
  DAYS,
  hoursRow,
  input,
  label,
} from "@/features/flyerBuilder/components/flyerEditorPanel.styles";

export default function FlyerEditorPanel({
  vportId,
  draft,
  setDraft,
  bucket = "vport-public",
  onSaved,
} = {}) {
  const { saving, uploadingKey, uploadAndSet, onSave } = useFlyerEditor({
    vportId,
    bucket,
    draft,
    setDraft,
    onSaved,
  });

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

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <style>
        {`
          @media (max-width: 560px) {
            .flyer-grid-hours-accent {
              grid-template-columns: 1fr !important;
            }

            .flyer-hours-row {
              grid-template-columns: 56px 1fr 1fr !important;
              grid-template-areas:
                "day open close"
                "closed closed closed" !important;
              row-gap: 8px !important;
            }

            .flyer-hours-day { grid-area: day; }
            .flyer-hours-open { grid-area: open; }
            .flyer-hours-close { grid-area: close; }
            .flyer-hours-closed {
              grid-area: closed;
              justify-content: flex-start !important;
              padding-top: 2px !important;
            }

            .flyer-accent-input {
              height: 52px !important;
            }

            .flyer-scope input,
            .flyer-scope textarea,
            .flyer-scope select {
              font-size: 16px !important;
            }
          }

          .flyer-color-input {
            -webkit-appearance: none;
            appearance: none;
            padding: 0;
            cursor: pointer;
          }
          .flyer-color-input::-webkit-color-swatch-wrapper {
            padding: 0;
          }
          .flyer-color-input::-webkit-color-swatch {
            border: none;
            border-radius: 10px;
          }
        `}
      </style>

      <div className="flyer-scope" style={card}>
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

        <div
          className="flyer-grid-hours-accent"
          style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10 }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div style={label}>Hours</div>
            <FlyerHoursTable
              days={DAYS}
              hoursValue={hoursValue}
              input={input}
              hoursRow={hoursRow}
              setHoursDay={setHoursDay}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={label}>Accent</div>
            <input
              className="flyer-color-input flyer-accent-input"
              type="color"
              value={(draft.accent_color || "#c23a3a").trim()}
              onChange={(e) => setField("accent_color", e.target.value)}
              style={{
                width: "100%",
                height: 44,
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
              inputMode="tel"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={label}>Website</div>
            <input
              style={input}
              value={draft.website_url || ""}
              onChange={(e) => setField("website_url", e.target.value)}
              placeholder="https://..."
              inputMode="url"
            />
          </div>
        </div>
      </div>

      <div className="flyer-scope" style={card}>
        <div style={{ fontWeight: 950, letterSpacing: 0.6 }}>Images</div>

        <ImageDropzone
          label={uploadingKey === "logo_url" ? "Logo (uploading...)" : "Logo"}
          value={draft.logo_url || ""}
          onPickFile={(file) => uploadAndSet("logo", "logo_url", file)}
          onClear={() => setField("logo_url", "")}
        />

        <ImageDropzone
          label={uploadingKey === "flyer_food_image_1" ? "Food 1 (uploading...)" : "Food 1"}
          value={draft.flyer_food_image_1 || ""}
          onPickFile={(file) => uploadAndSet("food1", "flyer_food_image_1", file)}
          onClear={() => setField("flyer_food_image_1", "")}
        />

        <ImageDropzone
          label={uploadingKey === "flyer_food_image_2" ? "Food 2 (uploading...)" : "Food 2"}
          value={draft.flyer_food_image_2 || ""}
          onPickFile={(file) => uploadAndSet("food2", "flyer_food_image_2", file)}
          onClear={() => setField("flyer_food_image_2", "")}
        />

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            marginTop: 4,
            padding: "13px 14px",
            borderRadius: 15,
            border: "1px solid rgba(0,255,240,0.22)",
            background:
              "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
            color: "#fff",
            fontWeight: 950,
            letterSpacing: 0.5,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.75 : 1,
            boxShadow: "0 18px 38px rgba(0,0,0,0.34)",
          }}
        >
          {saving ? "Saving..." : "Save Flyer Changes"}
        </button>
      </div>
    </div>
  );
}
