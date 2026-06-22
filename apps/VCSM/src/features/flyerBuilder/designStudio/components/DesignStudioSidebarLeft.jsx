import React from "react";
import { ImagePlus, PlusSquare, Type } from "lucide-react";

export default function DesignStudioSidebarLeft({
  assets,
  uploading,
  onUploadAsset,
  onAddText,
  onAddShape,
  onInsertAsset,
}) {
  return (
    <aside style={railStyle}>
      <button type="button" style={railBtn} onClick={onAddText}>
        <Type size={20} />
        <span style={railLabel}>Text</span>
      </button>

      <button type="button" style={railBtn} onClick={onAddShape}>
        <PlusSquare size={20} />
        <span style={railLabel}>Shape</span>
      </button>

      <label style={railBtn}>
        <ImagePlus size={20} />
        <span style={railLabel}>{uploading ? "Uploading..." : "Upload"}</span>
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await onUploadAsset(file);
            e.currentTarget.value = "";
          }}
        />
      </label>

      <div style={assetsStrip}>
        {(assets || []).slice(0, 8).map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => onInsertAsset(asset)}
            title={asset.mime || "asset"}
            style={assetBtn}
          >
            <img src={asset.url} alt="" style={assetThumb} />
          </button>
        ))}
      </div>
    </aside>
  );
}

const railStyle = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(180deg, rgba(17,21,35,0.92), rgba(8,11,21,0.86))",
  padding: 10,
  height: "100%",
  minHeight: 0,
  overflow: "auto",
  display: "grid",
  gridAutoRows: "max-content",
  gap: 10,
  alignContent: "start",
};

const railBtn = {
  display: "grid",
  justifyItems: "center",
  gap: 6,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 800,
  padding: "10px 8px",
  cursor: "pointer",
  textAlign: "center",
};

const railLabel = {
  lineHeight: 1.1,
};

const assetsStrip = {
  marginTop: 4,
  display: "grid",
  gap: 8,
};

const assetBtn = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  padding: 6,
  cursor: "pointer",
};

const assetThumb = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  borderRadius: 8,
  display: "block",
};
