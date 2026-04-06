import { ArrowRight } from "lucide-react";

export default function ModuleCard({
  icon: Icon,
  title,
  description,
  count,
  actionLabel,
  onOpen,
  previewCourses = [],
}) {
  const hasAccess = count > 0;

  return (
    <div
      className="learning-card"
      style={{
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 270,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "rgba(15, 74, 114, 0.1)",
          color: "var(--learning-primary)",
        }}
      >
        <Icon size={22} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <span className="learning-badge">{count} access</span>
        </div>
        <p style={{ margin: 0, color: "var(--learning-muted-text)", lineHeight: 1.5 }}>
          {description}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 72,
        }}
      >
        {(previewCourses.length ? previewCourses : [null, null, null]).slice(0, 3).map((course, index) => (
          <div
            key={course?.id ?? `${title}-${index}`}
            style={{
              borderRadius: 12,
              padding: "10px 12px",
              background: "var(--learning-muted)",
              color: course ? "var(--learning-text)" : "var(--learning-muted-text)",
              fontSize: 14,
            }}
          >
            {course?.title ?? "No course access assigned yet"}
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`learning-button ${hasAccess ? "learning-button-primary" : "learning-button-secondary"}`}
        onClick={onOpen}
        disabled={!hasAccess}
        style={{
          marginTop: "auto",
          opacity: hasAccess ? 1 : 0.6,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span>{hasAccess ? actionLabel : "Access pending"}</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
