import React from "react";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";

export function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid #222",
        background: active ? "#222" : "#fff",
        color: active ? "#fff" : "#222",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function CourseCard({ item, onOpenCourseRoster }) {
  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
        marginBottom: 12,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>
        {item?.course?.title ?? "Untitled Course"}
      </h3>

      <div style={{ marginBottom: 6 }}>
        <strong>Status:</strong> {item?.course?.status ?? "-"}
      </div>
      <div style={{ marginBottom: 6 }}>
        <strong>Members:</strong> {item?.summary?.totalMembers ?? 0}
      </div>
      <div style={{ marginBottom: 6 }}>
        <strong>Students:</strong> {item?.summary?.studentCount ?? 0}
      </div>
      <div style={{ marginBottom: 6 }}>
        <strong>Teachers:</strong> {item?.summary?.teacherCount ?? 0}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Parents:</strong> {item?.summary?.observerCount ?? 0}
      </div>

      <button
        type="button"
        onClick={() => onOpenCourseRoster?.(item)}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #222",
          background: "#222",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Open Course Roster
      </button>
    </div>
  );
}

export function OrganizationLoadingState() {
  return <LearningLoadingState label="Loading organization..." variant="organization" />;
}

export function ErrorBanner({ error }) {
  if (!error?.message && !error?.code) return null;

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        background: "#fef3f2",
        color: "#b42318",
        border: "1px solid #fecdca",
      }}
    >
      <div>{error?.message ?? error?.code}</div>
      {error?.details ? (
        <pre
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {typeof error.details === "string"
            ? error.details
            : JSON.stringify(error.details, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
