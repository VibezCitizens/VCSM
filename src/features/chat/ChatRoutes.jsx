import { Routes, Route } from 'react-router-dom';
import ChatScreen from './ChatScreen';
import ConversationList from './ConversationList';

export default function ChatRoutes() {
  return (
    <Routes>
      <Route index element={<ConversationList />} />
      <Route path=":conversationId" element={<ChatScreen />} />
    </Routes>
  );
}

