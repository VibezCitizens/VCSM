// src/features/chat/vchat/VChatLayout.jsx
import { Outlet, useParams } from 'react-router-dom';
import VConversationList from './VConversationList';

export default function VChatLayout() {
  const { id } = useParams(); // active conversation id (for left highlight)

  return (
    <div className="flex h-[calc(100dvh-4rem)] max-w-6xl mx-auto">
      {/* Left: VPORT inbox list */}
      <div className="w-full md:w-[340px] border-r border-neutral-800 overflow-y-auto">
        <VConversationList activeId={id || null} />
      </div>

      {/* Right: conversation panel */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
