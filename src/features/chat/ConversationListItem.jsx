// src/features/chat/ConversationListItem.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Bell, BellOff, Trash2 } from 'lucide-react';

export default function ConversationListItem({ conversationId, createdAt, onClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [other, setOther]     = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!user) return;

    // RPC to get the other user
    supabase
      .rpc('get_chat_partner', { conv_id: conversationId })
      .then(({ data, error }) => {
        if (error) console.error('get_chat_partner error:', error);
        else if (data?.length) setOther(data[0]);
      });

    // Your mute setting
    supabase
      .from('conversation_members')
      .select('muted')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setIsMuted(data.muted);
      });
  }, [conversationId, user]);

  const handleMute = async (e) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    const { error } = await supabase
      .from('conversation_members')
      .update({ muted: newMuted })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
    if (!error) setIsMuted(newMuted);
  };

  const handleLeave = async (e) => {
    e.stopPropagation();
    if (!confirm('Leave this conversation?')) return;
    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
    if (!error) navigate('/chat');
  };

  if (!other) {
    return <div className="p-2 text-gray-400">Loading…</div>;
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center p-2 hover:bg-neutral-800 rounded cursor-pointer"
    >
      <img
        src={other.photo_url || '/default.png'}
        alt={other.display_name || 'User'}
        className="w-8 h-8 rounded-full object-cover border border-neutral-700"
        onError={(e) => { e.currentTarget.src = '/default.png'; }}
      />

      <div className="flex-1 flex justify-between items-center ml-3">
        <div>
          <div className="text-white font-medium">{other.display_name}</div>
          <div className="text-gray-400 text-xs">
            {new Date(createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleMute} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted
              ? <BellOff className="w-5 h-5 text-gray-400 hover:text-white" />
              : <Bell    className="w-5 h-5 text-gray-400 hover:text-white" />
            }
          </button>
          <button onClick={handleLeave} title="Leave conversation">
            <Trash2 className="w-5 h-5 text-red-500 hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
