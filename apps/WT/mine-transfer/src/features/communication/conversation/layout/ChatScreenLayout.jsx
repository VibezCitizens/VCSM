// src/features/chat/conversation/layout/ChatScreenLayout.jsx

export default function ChatScreenLayout({
  header,
  messages,
  footer,
  messagesRef,
}) {
  return (
    <div className="h-full">
      <div className="chat-header">{header}</div>
      <div ref={messagesRef} className="chat-messages">{messages}</div>
      {footer ? <div className="chat-footer">{footer}</div> : null}
    </div>
  )
}
