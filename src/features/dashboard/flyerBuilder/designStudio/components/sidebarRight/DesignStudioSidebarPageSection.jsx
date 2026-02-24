import React from "react";

import DesignStudioInlineColorPicker from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioInlineColorPicker";
import {
  fieldLabel,
  fieldWrap,
  input,
  sectionTitle,
} from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/designStudioSidebarRight.styles";

export default function DesignStudioSidebarPageSection({ activePage, onPageMetaChange }) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <div style={sectionTitle}>Page</div>
      <label style={fieldWrap}>
        <span style={fieldLabel}>Background</span>
        <DesignStudioInlineColorPicker
          value={activePage?.background || "#0b1020"}
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
            value={activePage?.width || 1080}
            onChange={(e) => onPageMetaChange({ width: Number(e.target.value || 1080) })}
            style={input}
          />
        </label>
        <label style={fieldWrap}>
          <span style={fieldLabel}>Height</span>
          <input
            type="number"
            min={320}
            max={4000}
            value={activePage?.height || 1350}
            onChange={(e) => onPageMetaChange({ height: Number(e.target.value || 1350) })}
            style={input}
          />
        </label>
      </div>
    </section>
  );
}
