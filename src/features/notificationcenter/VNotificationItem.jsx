import React, { useEffect, useState } from "react";
import UserLink from "@/components/UserLink";
import useProfile from "@/hooks/useProfile";
import { supabase } from "@/lib/supabaseClient";

const emojiMap = { rose: "🌹", like: "❤️", laugh: "😂", fire: "🔥" };

export default function VportNotificationItem({ notif, onClick }) {
  const reactorUserId =
    notif.actor_user_id ||
    notif.context?.reactor_user_id ||
    notif.context?.follower_id ||
    notif.context?.sender_id ||
    null;

  const reactorVportId =
    notif.actor_vport_id ||
    notif.context?.reactor_vport_id ||
    null;

  const { profile: reactorUser, isLoading: userLoading } = useProfile(reactorUserId);
  const [reactorVport, setReactorVport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!reactorVportId) return;
    (async () => {
      const { data } = await supabase
        .from("vports")
        .select("id, name, avatar_url")
        .eq("id", reactorVportId)
        .maybeSingle();
      if (!cancelled) setReactorVport(data || null);
    })();
    return () => { cancelled = true; };
  }, [reactorVportId]);

  const Actor = () => {
    if (reactorVport) {
      return (
        <span className="inline-flex items-center gap-1 text-sm">
          <img src={reactorVport.avatar_url || "/avatar.jpg"} alt="" className="w-5 h-5 rounded-full" />
          <span>{reactorVport.name || "A VPORT"}</span>
        </span>
      );
    }
    if (userLoading) {
      return <span className="inline-block w-5 h-5 bg-neutral-700 rounded-full animate-pulse" />;
    }
    if (reactorUser) {
      return <UserLink user={reactorUser} avatarSize="w-5 h-5" textSize="text-sm" />;
    }
    return <span className="text-neutral-400 italic">Someone</span>;
  };

  let message;
  switch (notif.kind) {
    case "vpost_reaction":
    case "post_reaction":
      message = <>{emojiMap[notif.context?.reaction_type] || "🔔"} <Actor /> reacted to your VPORT post</>;
      break;
    case "vstory_reaction":
    case "story_reaction":
      message = <>{emojiMap[notif.context?.reaction_type] || "🔔"} <Actor /> reacted to your VPORT story</>;
      break;
    case "vmessage":
      message = <>📨 <Actor /> sent a message to your VPORT</>;
      break;
    case "vfollow":
      message = <>👤 <Actor /> followed your VPORT</>;
      break;
    default:
      message = <>🔔 New VPORT notification</>;
  }

  return (
    <li
      onClick={onClick}
      className="bg-neutral-800 p-3 rounded-lg shadow hover:bg-neutral-700 cursor-pointer flex justify-between items-center"
    >
      <div>
        <div className="text-sm">{message}</div>
        <div className="text-xs text-neutral-400">
          {new Date(notif.created_at).toLocaleString()}
        </div>
      </div>
      {!notif.is_read && (
        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">New</span>
      )}
    </li>
  );
}
