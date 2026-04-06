import { useNavigate } from "react-router-dom";

export function UnauthorizedScreen() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f6fbff 0%, #edf5fb 100%)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "#08111b" }}>
          Access not provisioned
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, margin: "0 0 28px" }}>
          Your account doesn&apos;t have access to any learning space yet.
          Contact your administrator to be added to a course or organization.
        </p>
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            border: "none",
            background: "#0f4a72",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}

export default UnauthorizedScreen;
