import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIdentity } from "@/features/communication/hooks/useIdentity";
import { supabase } from "@/services/supabase/supabaseClient";
import { useInbox, startDirectConversation } from "@/features/communication";
import TopBar from "@/learning/components/TopBar";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

const TYPE_CONFIG = {
  direct: { label: "Direct", bg: "#dbeafe", color: "#1e40af", icon: "DM" },
  course: { label: "Class Chat", bg: "#dcfce7", color: "#166534", icon: "CC" },
  organization: { label: "Staff", bg: "#fef9c3", color: "#854d0e", icon: "ST" },
  announcement: { label: "Announcement", bg: "#fef2f2", color: "#991b1b", icon: "AN" },
  group: { label: "Group", bg: "#f3e8ff", color: "#6b21a8", icon: "GR" },
};

function TypeBadge({ type }) {
  const c = TYPE_CONFIG[type] ?? { label: type, bg: "#f1f5f9", color: MUTED, icon: "?" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: c.bg, color: c.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</span>;
}

// Derive a UI "type" from the engine's InboxEntryModel
function deriveConversationType(entry) {
  if (entry.isAnnouncement || entry.accessMode === "announcement") return "announcement";
  if (entry.conversationKind === "direct") return "direct";
  if (entry.scopeKind === "course") return "course";
  if (entry.scopeKind === "organization") return "organization";
  return "group";
}

function ContactPickerModal({ open, onClose, onSelect, realmId, currentActorId }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    // Wentrex-specific RPC — returns who the actor can message (learning-schema policy)
    supabase.schema("learning").rpc("get_messageable_contacts").then(({ data, error }) => {
      if (error) setContacts([]);
      else setContacts(data ?? []);
      setLoading(false);
    });
  }, [open]);

  if (!open) return null;

  const filtered = search
    ? contacts.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()))
    : contacts;

  const groups = {};
  for (const c of filtered) {
    const role = c.role || "other";
    if (!groups[role]) groups[role] = [];
    groups[role].push(c);
  }

  const roleLabels = { owner: "Administrators", admin: "Administrators", staff: "Staff", teacher: "Teachers", student: "Students", parent: "Parents" };
  const roleOrder = ["owner", "admin", "staff", "teacher", "student", "parent"];

  async function handleSelect(contact) {
    setCreating(contact.actor_id);
    try {
      const { conversationId } = await startDirectConversation({
        fromActorId: currentActorId,
        realmId,
        picked: { actorId: contact.actor_id },
      });
      onSelect(conversationId);
      onClose();
    } catch (_err) {
      // conversation creation failed — stay on modal
    } finally {
      setCreating(null);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "grid", placeItems: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: "20px 24px 12px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>New Message</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: MUTED, padding: "0 4px" }}>x</button>
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts..." autoFocus
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 14, background: SURFACE, color: "#0f172a", boxSizing: "border-box" }} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 32, color: MUTED }}>Loading contacts...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: MUTED }}>
              {search ? "No contacts match your search." : "No contacts available."}
            </div>
          ) : (
            roleOrder.filter(r => groups[r]?.length).map(role => (
              <div key={role}>
                <div style={{ padding: "10px 24px 4px", fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>
                  {roleLabels[role] || role}
                </div>
                {groups[role].map(c => (
                  <div key={c.actor_id + c.context}
                    onClick={() => creating ? null : handleSelect(c)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 24px",
                      cursor: creating === c.actor_id ? "default" : "pointer",
                      opacity: creating && creating !== c.actor_id ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { if (!creating) e.currentTarget.style.background = SURFACE; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 18, background: PRIMARY,
                      display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>
                      {(c.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{c.full_name || "Unknown"}</div>
                      <div style={{ fontSize: 12, color: MUTED, textTransform: "capitalize" }}>{c.role}</div>
                    </div>
                    {creating === c.actor_id && <span style={{ fontSize: 12, color: PRIMARY }}>Opening...</span>}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function InboxScreen() {
  const navigate = useNavigate();
  const { identity, loading: identityLoading } = useIdentity();
  const actorId = identity?.actorId ?? null;
  const realmId = identity?.realmId ?? null;

  const { entries: rawEntries, loading, refresh } = useInbox({ actorId });

  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [tab, setTab] = useState("all");

  if (identityLoading || !actorId) return null;

  // Map engine InboxEntryModel to UI shape
  const conversations = rawEntries.map(entry => {
    const type = deriveConversationType(entry);
    const isGroup = entry.conversationKind !== "direct";

    let displayName = entry.title || "";
    if (!isGroup && !displayName) {
      displayName = entry.partnerDisplayName || "Unknown";
    }
    if (!displayName) displayName = "Conversation";

    return {
      id: entry.conversationId,
      displayName,
      type,
      isGroup,
      isAnnouncement: entry.isAnnouncement,
      unreadCount: entry.unreadCount || 0,
      pinned: entry.pinned,
      muted: entry.muted,
      lastMessageAt: entry.lastMessageAt,
      preview: entry.preview || entry.lastMessageBody || "",
    };
  });

  const tabs = [
    { key: "all", label: "All" },
    { key: "direct", label: "Direct" },
    { key: "course", label: "Class Chats" },
    { key: "organization", label: "Staff" },
  ];

  const filtered = conversations
    .filter(c => tab === "all" || c.type === tab)
    .filter(c => !search || c.displayName.toLowerCase().includes(search.toLowerCase()));

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName="Communication" subtitle="Messages" backTo="/dashboard" backLabel="Dashboard" />

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Communication</span>
            <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
              Messages
              {unreadTotal > 0 && (
                <span style={{ marginLeft: 10, padding: "2px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700, background: "#dc2626", color: "#fff", verticalAlign: "middle" }}>
                  {unreadTotal}
                </span>
              )}
            </h1>
          </div>
          <button onClick={() => setShowNewModal(true)}
            style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: PRIMARY, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            + New Message
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${BORDER}` }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "10px 18px", border: "none", background: "none",
              fontSize: 14, fontWeight: tab === t.key ? 700 : 500, cursor: "pointer",
              color: tab === t.key ? PRIMARY : MUTED,
              borderBottom: tab === t.key ? `2px solid ${PRIMARY}` : "2px solid transparent",
              marginBottom: -2,
            }}>
              {t.label}
              {t.key !== "all" && (() => {
                const count = conversations.filter(c => c.type === t.key && c.unreadCount > 0).length;
                return count > 0 ? <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "#dc2626", color: "#fff" }}>{count}</span> : null;
              })()}
            </button>
          ))}
        </div>

        {/* Search */}
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations..."
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 14, background: "#fff", color: "#0f172a", boxSizing: "border-box" }} />

        {/* Conversation list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: MUTED }}>Loading conversations...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 48, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: SURFACE, display: "inline-grid", placeItems: "center", fontSize: 24, marginBottom: 14, border: `1px solid ${BORDER}` }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              {tab !== "all" ? `No ${tabs.find(t => t.key === tab)?.label.toLowerCase()} conversations` : "No conversations yet"}
            </div>
            <div style={{ fontSize: 14, color: MUTED }}>
              {tab === "course" ? "Class group chats will appear here when you join a course." :
               tab === "organization" ? "Staff conversations will appear here." :
               "Click \"+ New Message\" above to start a conversation."}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {filtered.map((c, i) => (
              <div key={c.id} onClick={() => navigate(`/messages/${c.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: c.unreadCount > 0 ? "#f0f9ff" : "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
                onMouseLeave={e => { e.currentTarget.style.background = c.unreadCount > 0 ? "#f0f9ff" : "transparent"; }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: c.isGroup ? 12 : 22,
                  background: (TYPE_CONFIG[c.type] ?? TYPE_CONFIG.direct).bg,
                  color: (TYPE_CONFIG[c.type] ?? TYPE_CONFIG.direct).color,
                  display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>
                  {c.isGroup ? (TYPE_CONFIG[c.type]?.icon || "GR") : c.displayName.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: c.unreadCount > 0 ? 700 : 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.displayName}
                    </span>
                    <TypeBadge type={c.type} />
                    {c.pinned && <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>PINNED</span>}
                  </div>
                  {c.preview && (
                    <div style={{ fontSize: 13, color: c.unreadCount > 0 ? "#334155" : MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: c.unreadCount > 0 ? 500 : 400 }}>
                      {c.preview}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0, minWidth: 50 }}>
                  <span style={{ fontSize: 11, color: MUTED }}>{timeAgo(c.lastMessageAt)}</span>
                  {c.unreadCount > 0 && (
                    <span style={{ padding: "2px 7px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#dc2626", color: "#fff", minWidth: 18, textAlign: "center" }}>
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContactPickerModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        realmId={realmId}
        currentActorId={actorId}
        onSelect={(convId) => { refresh(); navigate(`/messages/${convId}`); }}
      />
    </div>
  );
}
