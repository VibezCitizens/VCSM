// src/features/chat/conversation/layout/ChatScreenLayout.jsx

export default function ChatScreenLayout({
  header,
  messages,
  footer,
}) {
  return (
    <div className="chat-screen">
      <div className="chat-header">{header}</div>
      <div className="chat-messages">{messages}</div>
      <div className="chat-footer">{footer}</div>
    </div>
  )
}
