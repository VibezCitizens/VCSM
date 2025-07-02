import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import MessageInput from './MessageInput';
import MessageItem from './MessageItem';
import ChatHeader from '@/components/ChatHeader';

export default function ChatScreen() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participantProfiles, setParticipantProfiles] = useState({});
  const messagesEndRef = useRef(null);

  const participantProfilesRef = useRef({});
  useEffect(() => {
    participantProfilesRef.current = participantProfiles;
  }, [participantProfiles]);

  useEffect(() => {
    if (!conversationId || conversationId === 'null') {
      navigate('/chat', { replace: true });
    }
  }, [conversationId, navigate]);

  useEffect(() => {
    const ensureMembership = async () => {
      if (!conversationId || !currentUser?.id) return;

      const { count, error } = await supabase
        .from('conversation_members')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);

      if (error) console.error("Membership check failed:", error);
      if (count === 0) {
        await supabase.from('conversation_members').insert({
          conversation_id: conversationId,
          user_id: currentUser.id,
        });
      }
    };

    if (!authLoading && currentUser) {
      ensureMembership();
    }
  }, [conversationId, currentUser, authLoading]);

  const getSenderProfile = useCallback(async (senderId) => {
    if (participantProfilesRef.current[senderId]) {
      return participantProfilesRef.current[senderId];
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, photo_url')
      .eq('id', senderId)
      .single();

    if (error) {
      console.error(`Error loading profile for ${senderId}:`, error);
      return null;
    }

    if (data) {
      setParticipantProfiles((prev) => ({ ...prev, [senderId]: data }));
    }
    return data;
  }, []);

  useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const loadMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(display_name, photo_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      } else {
        setMessages(data || []);
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
  }, [conversationId, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading…</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Fixed Header */}
      <div className="shrink-0 border-b border-white/10">
        <ChatHeader />
      </div>

      {/* Scrollable Message Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            const sender = msg.sender || participantProfiles[msg.sender_id] || {};
            return (
              <MessageItem
                key={msg.id}
                msg={msg}
                isMe={isMe}
                sender={sender}
                currentUser={currentUser}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input */}
      <div className="shrink-0 border-t border-white/10 px-4 py-2">
        <MessageInput
          conversationId={conversationId}
          currentUser={currentUser}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
