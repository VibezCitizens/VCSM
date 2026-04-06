import React from "react";

function getSubmissionId(item) {
  return item?.submission?.id ?? item?.id ?? null;
}

function getStudentActorId(item) {
  return (
    item?.studentActorId ??
    item?.submission?.actorId ??
    item?.actorId ??
    "-"
  );
}

function getAssignmentTitle(item) {
  return (
    item?.assignment?.title ??
    item?.assignmentTitle ??
    "Untitled Assignment"
  );
}

function getStatus(item) {
  return (
    item?.grade?.status ??
    item?.submission?.status ??
    item?.status ??
    "-"
  );
}

function getSubmittedAt(item) {
  return (
    item?.submission?.submittedAt ??
    item?.submission?.updatedAt ??
    item?.submittedAt ??
    item?.updatedAt ??
    "-"
  );
}

export function SubmissionQueueList({
  items = [],
  selectedSubmissionId = null,
  onSelect,
  title = "Submission Queue",
}) {
  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #d0d7de",
          fontWeight: 700,
        }}
      >
        {title} ({items.length})
      </div>

      {items.length === 0 && (
        <div style={{ padding: 16, color: "#666" }}>No submissions found.</div>
      )}

      {items.length > 0 && (
        <div>
          {items.map((item) => {
            const submissionId = getSubmissionId(item);
            const isSelected = submissionId === selectedSubmissionId;

            return (
              <button
                key={submissionId ?? `${getAssignmentTitle(item)}-${getStudentActorId(item)}`}
                type="button"
                onClick={() => onSelect?.(item)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: 16,
                  border: "none",
                  borderBottom: "1px solid #eee",
                  background: isSelected ? "#f3f4f6" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {getAssignmentTitle(item)}
                </div>

                <div style={{ fontSize: 14, color: "#555", marginBottom: 4 }}>
                  Student: {getStudentActorId(item)}
                </div>

                <div style={{ fontSize: 14, color: "#555", marginBottom: 4 }}>
                  Status: {getStatus(item)}
                </div>

                <div style={{ fontSize: 13, color: "#777" }}>
                  Updated: {getSubmittedAt(item)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SubmissionQueueList;