import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Assuming this path is correct

export default function MessageInput({ conversationId, currentUser, onSend }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    // Basic validation to ensure message content, conversation ID, and sender ID exist
    if (!text.trim() || !conversationId || !currentUser?.id) {
      console.warn('MessageInput: Cannot send empty message or missing context (conversationId/currentUser).');
      return;
    }

    setSending(true); // Indicate that the message is being sent

    // Attempt to insert the message into the 'messages' table
    // IMPORTANT: This code assumes that 'ciphertext' and 'iv' columns
    // in your 'public.messages' table are now NULLABLE.
    // If they are still NOT NULL, you MUST include 'ciphertext: ""' and 'iv: {}'
    // in the object below to satisfy the database constraints.
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId, // The ID of the conversation
      sender_id: currentUser.id,       // The ID of the user sending the message
      text: text.trim(),               // The actual message content (now assumed to be nullable/present)
    });

    if (error) {
      console.error('Failed to send message:', error);
      // In a production application, you would replace `console.log` with a
      // more user-friendly error display (e.g., a toast notification or a modal).
      console.log('Failed to send message:', error.message);
    } else {
      setText(''); // Clear the input field upon successful message send
      // You could optionally trigger an `onSend` prop here for optimistic UI updates
      // if `ChatScreen` needs immediate feedback before the real-time subscription
      // catches up, though the real-time listener should handle it.
    }

    setSending(false); // Reset sending state after the operation
  };

  const handleKeyDown = (e) => {
    // Detect 'Enter' key press to send the message.
    // `!e.shiftKey` ensures that pressing Shift+Enter allows for new lines in the textarea.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default Enter key behavior (like adding a new line)
      sendMessage();      // Call the sendMessage function
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-neutral-900 border-t border-neutral-800">
      <textarea
        rows={1} // Start with a single row
        value={text}
        onChange={(e) => setText(e.target.value)} // Update state on input change
        onKeyDown={handleKeyDown} // Handle keyboard events
        placeholder="Type a message..."
        // Tailwind CSS classes for styling:
        className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 resize-none text-white
                   focus:outline-none focus:ring-2 focus:ring-purple-600
                   transition-all duration-200 ease-in-out"
        disabled={sending} // Disable input while sending
        // Style to allow vertical resizing but within limits for better UX
        style={{ minHeight: '40px', maxHeight: '120px', overflowY: 'auto' }}
      />
      <button
        onClick={sendMessage} // Call sendMessage on button click
        disabled={!text.trim() || sending} // Disable if text is empty or sending
        // Tailwind CSS classes for styling the button:
        className="bg-purple-600 text-white px-4 py-2 rounded-lg
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:bg-purple-700 transition-colors duration-200 ease-in-out
                   shadow-md hover:shadow-lg"
      >
        {sending ? 'Sending...' : 'Send'} {/* Button text changes when sending */}
      </button>
    </div>
  );
}