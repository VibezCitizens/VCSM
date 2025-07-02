import { Routes, Route, Navigate } from 'react-router-dom';
import ChatScreen from "./ChatScreen"; // ✅ Correct relative path
import ConversationsList from "./ConversationList"; // ✅ Correct

/**
 * ChatRoutes component to handle nested routing for the chat feature.
 * This component is rendered when the path matches /chat/*.
 */
export default function ChatRoutes() {
  return (
    <Routes>
      {/* Route for displaying a specific chat conversation */}
      {/* The :conversationId parameter is used by ChatScreen to fetch messages */}
      <Route path=":conversationId" element={<ChatScreen />} />

      {/* Default route for /chat (e.g., if no conversationId is provided) */}
      {/* This could show a list of conversations or a prompt to start one */}
      <Route path="/" element={<ConversationsList />} />

      {/* Fallback for any other /chat/* routes that don't match */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}
