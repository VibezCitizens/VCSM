import { useEffect, useMemo, useRef, useState } from "react";
import { useIdentity } from "@/features/communication/hooks/useIdentity";
import { useConversation, useConversationMessages, useConversationMembers } from "@/features/communication";
import TopBar from "@/learning/components/TopBar";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ConversationView({ conversationId }) {
  const { identity } = useIdentity();
  const actorId = identity?.actorId ?? null;

  const { conversation, loading: convLoading } = useConversation({ conversationId, actorId });
  const { messages, loading: msgsLoading, onSendMessage } = useConversationMessages({ conversationId, actorId });
  const { members, me } = useConversationMembers({ conversationId, actorId });

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Build sender name map from engine-hydrated members
  const senderMap = useMemo(() => {
    const map = new Map();
    for (const m of members) {
      if (m.actorId) map.set(m.actorId, m.displayName || "Unknown");
    }
    return map;
  }, [members]);

  // Derive partner name for direct conversations
  const partnerName = useMemo(() => {
    if (conversation?.isGroup || conversation?.title) return "";
    const partner = members.find(m => m.actorId !== actorId);
    return partner?.displayName || "";
  }, [conversation, members, actorId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim() || sending || !actorId) return;
    setSending(true);
    await onSendMessage({ body: body.trim(), type: "text" });
    setBody("");
    setSending(false);
  }

  const displayTitle = conversation?.title || partnerName || "Conversation";

  // Posting rights: check current user's membership canPost flag.
  // For announcements, only designated posters have canPost=true.
  const canPost = me?.canPost !== false;

  const loading = convLoading || msgsLoading;

  if (loading && !conversation) return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName="Messages" subtitle="" backTo="/messages" backLabel="Back" />
      <div style={{ textAlign: "center", padding: 40, color: MUTED }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: SURFACE }}>
      <TopBar orgName={displayTitle} subtitle={conversation?.conversationKind ?? ""} backTo="/messages" backLabel="Back" />

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: MUTED, marginTop: "auto", marginBottom: "auto" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>No messages yet</div>
            <div style={{ fontSize: 13 }}>Send the first message to start the conversation.</div>
          </div>
        ) : (
          messages.map(m => {
            const isSelf = m.senderActorId === actorId;
            const senderName = senderMap.get(m.senderActorId) || "Unknown";

            return (
              <div key={m.id} style={{
                display: "flex", flexDirection: "column",
                alignItems: isSelf ? "flex-end" : "flex-start",
                maxWidth: "75%", alignSelf: isSelf ? "flex-end" : "flex-start",
              }}>
                {!isSelf && conversation?.isGroup && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, marginBottom: 2, marginLeft: 12 }}>
                    {senderName}
                  </span>
                )}
                <div style={{
                  padding: "10px 16px",
                  borderRadius: isSelf ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isSelf ? PRIMARY : "#fff",
                  color: isSelf ? "#fff" : "#0f172a",
                  border: isSelf ? "none" : `1px solid ${BORDER}`,
                  fontSize: 14, lineHeight: 1.5, wordBreak: "break-word",
                }}>
                  {m.body}
                </div>
                <span style={{ fontSize: 11, color: MUTED, marginTop: 2, marginLeft: 4, marginRight: 4 }}>
                  {formatTime(m.createdAt)}
                  {m.isEdited && " (edited)"}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      {canPost ? (
        <form onSubmit={handleSend} style={{
          display: "flex", gap: 8, padding: "12px 20px",
          borderTop: `1px solid ${BORDER}`, background: "#fff",
        }}>
          <input
            type="text" value={body} onChange={e => setBody(e.target.value)}
            placeholder="Type a message..."
            autoFocus
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${BORDER}`, fontSize: 14,
              background: "#fff", color: "#0f172a", boxSizing: "border-box",
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
            }}
          />
          <button type="submit" disabled={!body.trim() || sending}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: !body.trim() ? MUTED : PRIMARY, color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: sending ? "default" : "pointer",
            }}>
            {sending ? "..." : "Send"}
          </button>
        </form>
      ) : (
        <div style={{ padding: "14px 20px", textAlign: "center", fontSize: 13, color: MUTED, borderTop: `1px solid ${BORDER}`, background: "#fff" }}>
          Only admins can post in this conversation.
        </div>
      )}
    </div>
  );
}
