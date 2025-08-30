import { Routes, Route, Navigate } from 'react-router-dom';
import VConversationList from './VConversationList';
import VChatScreen from './VChatScreen';

export default function VChatRoutes() {
  return (
    <Routes>
      <Route index element={<VConversationList />} />
      <Route path=":id" element={<VChatScreen />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
