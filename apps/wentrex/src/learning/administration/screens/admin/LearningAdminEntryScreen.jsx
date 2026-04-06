import React from "react";
import { useNavigate } from "react-router-dom";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";
import { useAdminEntry } from "@/learning/administration/hooks/admin/useAdminEntry";
import { DiagnosticsPanel } from "@/learning/administration/components/admin/DiagnosticsPanel";
import { AdminEntryMembershipCard } from "@/learning/administration/components/admin/AdminEntryMembershipCard";

function AdminEntryErrorView({ error }) {
  return (
    <div style={{ minHeight: "100vh", background: "#edf5fb", padding: 24 }}>
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 20,
          padding: 28,
          border: "1px solid #dbe3ec",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 12, fontSize: 28, color: "#08111b" }}>
          Administration
        </h1>
        <div style={{ color: "#b42318", marginBottom: 18 }}>
          {error?.message ?? "Failed to load admin access"}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#0f4a72",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function MembershipList({ memberships }) {
  if (memberships.length > 0) {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        {memberships.map((membership) => (
          <AdminEntryMembershipCard
            key={`${membership.organizationId}:${membership.role}`}
            membership={membership}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #dbe3ec",
        borderRadius: 16,
        padding: 18,
        background: "#ffffff",
        color: "#4b5563",
        lineHeight: 1.65,
      }}
    >
      No active organization admin or staff memberships are currently routable from this account.
    </div>
  );
}

function AdminEntryHeader({ title, message, navigate }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-start",
        flexWrap: "wrap",
        marginBottom: 20,
      }}
    >
      <div>
        <div
          style={{
            display: "inline-block",
            marginBottom: 10,
            padding: "6px 12px",
            borderRadius: 999,
            background: "#dbeafe",
            color: "#0f4a72",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Admin Access
        </div>
        <h1 style={{ margin: 0, fontSize: 30, color: "#08111b" }}>{title}</h1>
        <p style={{ margin: "12px 0 0", maxWidth: 700, color: "#4b5563", lineHeight: 1.65 }}>
          {message}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #c8d5e5",
            background: "#fff",
            color: "#1f2937",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#0f4a72",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}

export function LearningAdminEntryScreen() {
  const navigate = useNavigate();
  const { isLoading, error, data, memberships, title, message } = useAdminEntry();

  if (isLoading) {
    return <LearningLoadingState label="Loading administration..." variant="home" />;
  }

  if (error) {
    return <AdminEntryErrorView error={error} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(139, 198, 255, 0.22), transparent 24%), radial-gradient(circle at bottom right, rgba(251, 191, 36, 0.14), transparent 24%), linear-gradient(180deg, #f6fbff 0%, #edf5fb 100%)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            border: "1px solid #dbe3ec",
            boxShadow: "0 18px 40px rgba(15, 74, 114, 0.08)",
            padding: 28,
          }}
        >
          <AdminEntryHeader title={title} message={message} navigate={navigate} />

          {data?.user?.email ? (
            <div style={{ marginBottom: 20, color: "#5f6f82", fontSize: 14 }}>
              Signed in as {data.user.email}
            </div>
          ) : null}

          <MembershipList memberships={memberships} />

          {data?.actorId ? <DiagnosticsPanel actorId={data.actorId} /> : null}
        </div>
      </div>
    </div>
  );
}

export default LearningAdminEntryScreen;
