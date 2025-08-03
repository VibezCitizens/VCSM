// src/features/chat/ChatRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ConversationList from './ConversationList';
import ChatScreen from './ChatScreen';

export default function ChatRoutes() {
  return (
    <Routes>
      {/* index → /chat */}
      <Route index element={<ConversationList />} />

      {/* /chat/:id */}
      <Route path=":id" element={<ChatScreen />} />

      {/* anything else under /chat/* */}
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
