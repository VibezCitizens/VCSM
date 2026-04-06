import React from "react";

import DesignStudioInlineColorPicker from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioInlineColorPicker";
import {
  fieldLabel,
  fieldWrap,
  input,
  sectionTitle,
} from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/designStudioSidebarRight.styles";

export default function DesignStudioSidebarPageSection({
  activePage,
  sceneMeta,
  onPageMetaChange,
}) {
  const pageWidth = Number(sceneMeta?.width || activePage?.width || 1080);
  const pageHeight = Number(sceneMeta?.height || activePage?.height || 1350);
  const pageBackground = sceneMeta?.background || activePage?.background || "#0b1020";

  return (
    <section style={{ display: "grid", gap: 8 }}>
      <div style={sectionTitle}>Page</div>
      <label style={fieldWrap}>
        <span style={fieldLabel}>Background</span>
        <DesignStudioInlineColorPicker
          value={pageBackground}
          onChange={(next) => onPageMetaChange({ background: next })}
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label style={fieldWrap}>
          <span style={fieldLabel}>Width</span>
          <input
            type="number"
            min={320}
            max={4000}
            value={pageWidth}
            onChange={(e) =>
              onPageMetaChange({ width: toBoundedSize(e.target.value, pageWidth) })
            }
            style={input}
          />
        </label>
        <label style={fieldWrap}>
          <span style={fieldLabel}>Height</span>
          <input
            type="number"
            min={320}
            max={4000}
            value={pageHeight}
            onChange={(e) =>
              onPageMetaChange({ height: toBoundedSize(e.target.value, pageHeight) })
            }
            style={input}
          />
        </label>
      </div>
    </section>
  );
}

function toBoundedSize(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(320, Math.min(4000, Math.round(n)));
}
