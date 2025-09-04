import { useIdentity } from "@/state/identityContext";
import { useVportNotifications } from "@/hooks/useVportNotifications";
import { useNavigate } from "react-router-dom";
import VportNotificationItem from "./VNotificationItem";

export default function VportNotifications() {
  const { identity } = useIdentity();
  const authUserId = identity?.userId || null; // recipient_user_id is the human account
  const { items, unread, loading, error, markAsRead, markAllRead } = useVportNotifications(authUserId, 50);
  const navigate = useNavigate();

  const handleClick = async (n) => {
    await markAsRead(n.id);
    const meta = n.context || {};
    switch (n.object_type) {
      case "vpost":
      case "post":
        meta.post_id && navigate(`/noti/post/${meta.post_id}`); // your existing screen handles both posts & vport_posts
        break;
      case "vstory":
      case "story":
        meta.story_id && navigate(`/noti/story/${meta.story_id}`); // existing screen handles both
        break;
      case "vmessage":
      case "message":
        meta.conversation_id && navigate(`/vnoti/message/${meta.conversation_id}`); // vchat redirect
        break;
      default:
        // no-op
        break;
    }
  };

  return (
    <div className="p-4 text-white max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">VPORT Notifications {unread > 0 && <span>({unread})</span>}</h1>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs bg-neutral-700 hover:bg-neutral-600 rounded px-2 py-1"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading && <p className="text-neutral-500">Loading…</p>}
      {error && <p className="text-red-400 text-sm">Error: {error.message}</p>}
      {!loading && items.length === 0 && <p className="text-neutral-500">No notifications yet.</p>}

      <ul className="space-y-4">
        {items.map((n) => (
          <VportNotificationItem key={n.id} notif={n} onClick={() => handleClick(n)} />
        ))}
      </ul>
    </div>
  );
}
