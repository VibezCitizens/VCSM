function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SubmissionFilesList({ files = [] }) {
  if (!files.length) return null;

  return (
    <div className="learning-card" style={{ padding: 20 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>
        Submitted Files
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {files.map((file) => (
          <div
            key={file.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--learning-border)",
              background: "var(--learning-muted)",
            }}
          >
            <span style={{ fontSize: 14, color: "var(--learning-text)", wordBreak: "break-all" }}>
              {file.originalName ?? file.storagePath ?? "File"}
            </span>
            <span style={{ fontSize: 12, color: "var(--learning-muted-text)", whiteSpace: "nowrap" }}>
              {formatBytes(file.sizeBytes)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
