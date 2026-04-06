import { useNavigate } from "react-router-dom";
import { logoutCleanup } from "@/features/identity/useWentrexIdentity";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

export default function TopBar({ orgName, subtitle, userName, role, backTo, backLabel, settingsTo }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutCleanup();
    navigate("/", { replace: true });
  }

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 28px", background: "#fff", borderBottom: `1px solid ${BORDER}`,
      position: "sticky", top: 0, zIndex: 100,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: PRIMARY,
          display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 15,
        }}>L</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>{orgName || "WENTREX"}</div>
          {subtitle && <div style={{ fontSize: 12, color: MUTED }}>{subtitle}</div>}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => navigate("/messages")}
          style={{
            padding: "7px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
            background: "#fff", color: "#334155", fontSize: 13, fontWeight: 500,
            cursor: "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
        >
          Inbox
        </button>

        {settingsTo && (
          <button
            onClick={() => navigate(settingsTo)}
            style={{
              padding: "7px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
              background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer",
            }}
          >
            Settings
          </button>
        )}

        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            style={{
              padding: "7px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
              background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer",
            }}
          >
            {backLabel ?? "Back"}
          </button>
        )}

        <div style={{ textAlign: "right", marginLeft: 4 }}>
          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{userName}</div>
          {role && <div style={{ fontSize: 12, color: MUTED }}>{role}</div>}
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "7px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
            background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
