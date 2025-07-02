// ChatScreen.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient'; // Adjust path if needed
import { useAuth } from '@/hooks/useAuth'; // Adjust path if needed
import MessageInput from './MessageInput'; // Adjust path if needed
import MessageItem from './MessageItem'; // Make sure this is imported if you're using React.memo

export default function ChatScreen() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participantProfiles, setParticipantProfiles] = useState({});
  const messagesEndRef = useRef(null);

  // Ref to hold the current participant profiles to avoid direct dependency in useCallback
  const participantProfilesRef = useRef({});

  // Effect to keep the ref updated with the latest state
  useEffect(() => {
    participantProfilesRef.current = participantProfiles;
  }, [participantProfiles]);

  // Redirect if conversationId is missing or null
  useEffect(() => {
    if (!conversationId || conversationId === 'null') {
      navigate('/chat', { replace: true });
    }
  }, [conversationId, navigate]);

  // Ensure user is a member of the conversation or add them
  useEffect(() => {
    const ensureMembership = async () => {
      if (!conversationId || !currentUser?.id) {
        console.warn("ensureMembership called with missing conversationId or currentUser.id", { conversationId, userId: currentUser?.id });
        return;
      }


      // THIS IS THE CRUCIAL CHANGE: using select with count and head
      const { count, error, status } = await supabase
        .from('conversation_members')
        .select('*', { count: 'exact', head: true }) // <-- MUST BE THIS LINE
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);

      // Log the error details for debugging
      if (error) {
        console.error("Error checking conversation membership:", error.message, "Status:", status, "Error object:", error);
      }

      // If count is 0, user is not a member, so add them
      if (count === 0) { // <-- MUST BE THIS CONDITION
        console.log("User not a member, attempting to add to conversation:", conversationId, "user:", currentUser.id);
        const { error: insertError } = await supabase.from('conversation_members').insert({
          conversation_id: conversationId,
          user_id: currentUser.id,
        });
        if (insertError) {
          console.error("Error adding user to conversation members:", insertError.message, insertError);
        } else {
          console.log("User successfully added to conversation members.");
        }
      }
    };
    
    // Only run membership check once auth is loaded and user is available
    if (!authLoading && currentUser) {
      ensureMembership();
    }
  }, [conversationId, currentUser, authLoading]);

  // Callback to fetch or get sender profile from cache
  const getSenderProfile = useCallback(async (senderId) => {
    // Check the ref first for cached profile
    if (participantProfilesRef.current[senderId]) {
      return participantProfilesRef.current[senderId];
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, photo_url')
      .eq('id', senderId)
      .single();

    if (error) {
        console.error(`Error fetching profile for ${senderId}:`, error.message, error);
    }

    if (data) {
      // Update state directly, using the functional update form to avoid stale closures
      setParticipantProfiles((prev) => ({ ...prev, [senderId]: data }));
    }
    return data;
  }, [setParticipantProfiles]); // setParticipantProfiles is a stable function, so this won't cause re-renders of the callback itself.

  // Load messages for the current conversation
  useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const loadMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        // Select all message fields, and related sender profile fields
        .select('*, sender:profiles(display_name, photo_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error loading messages:", error.message, error); // Log full error object
        setMessages([]);
      } else {
        setMessages(data || []);
        // Pre-cache sender profiles from loaded messages
        const cache = {};
        data.forEach((m) => {
          if (m.sender && !cache[m.sender_id]) {
            cache[m.sender_id] = m.sender;
          }
        });
        setParticipantProfiles((prev) => ({ ...prev, ...cache }));
      }
      setLoading(false);
    };

    loadMessages();

    // IMPORTANT: Realtime subscription for messages is commented out as per previous instructions
    // This was done to resolve "websocket connection failed" errors.
    /*
    const channel = supabase
      .channel(`chat_messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // You might need to fetch the sender profile for the new message
          // if it's not already cached, or if the payload doesn't include it.
          const newMsg = payload.new;
          if (newMsg.sender_id && !participantProfilesRef.current[newMsg.sender_id]) { // Use ref here
            // Fetch sender profile if not already in cache
            getSenderProfile(newMsg.sender_id).then(profile => {
              setMessages((prev) => [...prev, { ...newMsg, sender: profile }]);
            });
          } else {
            setMessages((prev) => [...prev, { ...newMsg, sender: participantProfilesRef.current[newMsg.sender_id] }]); // Use ref here
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    */

  }, [conversationId, currentUser?.id]); // getSenderProfile removed from dependencies

  // Scroll to the bottom of the messages when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handler for when a new message is sent (from MessageInput component)
  const handleSend = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  // Loading state for initial authentication
  if (authLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading…</div>;
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Message display area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            // Get sender details from loaded message or cached profiles
            const sender = msg.sender || participantProfiles[msg.sender_id] || {};

            return (
              <MessageItem
                key={msg.id}
                msg={msg}
                isMe={isMe}
                sender={sender}
                currentUser={currentUser}
                participantProfiles={participantProfiles} // If MessageItem needs it, pass it
              />
            );
          })
        )}
        <div ref={messagesEndRef} /> {/* Scroll target */}
      </div>

      {/* Message input area */}
      <MessageInput
        conversationId={conversationId}
        currentUser={currentUser}
        onSend={handleSend}
      />
    </div>
  );
}