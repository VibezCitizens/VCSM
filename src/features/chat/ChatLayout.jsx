// src/features/chat/ChatLayout.jsx
import { Outlet, useParams } from 'react-router-dom';
import ConversationList from '@/features/chat/ConversationList';

export default function ChatLayout() {
  // Pass activeId so the list can suppress unread dot for the open thread
  const { id: activeId } = useParams();
  return (
    <div className="h-[100dvh] grid grid-cols-[340px_1fr]">
      <aside className="overflow-y-auto border-r border-neutral-800">
        <ConversationList activeId={activeId} />
      </aside>
      <main className="overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
