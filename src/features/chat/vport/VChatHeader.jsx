import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/state/identityContext";

/**
 * Props:
 * - conversationId?: string   (optional; if not provided, uses route param :id)
 * - currentUserId?: string    (optional; if not provided, uses auth.uid())
 *
 * Shows:
 *   - If acting as the convo's VPORT → show the *user* partner (via RPC).
 *   - Otherwise → show the VPORT (name/avatar).
 */
export default function VChatHeader({ conversationId: propConversationId, currentUserId: propCurrentUserId }) {
  const params = useParams();
  const routeConversationId = params?.id;
  const { user } = useAuth();
  const { identity } = useIdentity(); // { type: 'user'|'vport', vportId? }

  const conversationId = propConversationId ?? routeConversationId ?? null;
  const currentUserId  = propCurrentUserId ?? user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null); // { id, vport_id, vport:{ id,name,avatar_url } }
  const [partnerProfile, setPartnerProfile] = useState(null); // { id, username, display_name, photo_url }
  const [err, setErr] = useState("");

  // ---- load conversation + (optionally) partner via RPC ---------------------
  useEffect(() => {
    let cancelled = false;
    if (!conversationId || !currentUserId) return;

    (async () => {
      setLoading(true);
      setErr("");
      setPartnerProfile(null);
      setConversation(null);

      // 1) Conversation meta (allowed by RLS to members)
      const { data: convo, error: cErr } = await supabase
        .from("vport_conversations")
        .select("id, vport_id, vport:vports ( id, name, avatar_url )")
        .eq("id", conversationId)
        .maybeSingle();

      if (cancelled) return;

      if (cErr || !convo) {
        setErr(cErr?.message || "Failed to load conversation.");
        setLoading(false);
        return;
      }
      setConversation(convo);

      // 2) If I'm acting as THIS conversation's VPORT, fetch the user partner via SECURITY DEFINER RPC
      const actingAsThisVport =
        identity?.type === "vport" && identity?.vportId && identity.vportId === convo.vport_id;

      if (actingAsThisVport) {
        const { data: prof, error: pErr } = await supabase.rpc("get_vport_chat_partner", {
          conv_id: conversationId,
          requester: currentUserId,
        });

        if (cancelled) return;

        if (pErr) {
          console.warn("[VChatHeader] partner RPC warning:", pErr);
        } else if (prof) {
          setPartnerProfile(prof);
        }
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [conversationId, currentUserId, identity?.type, identity?.vportId]);

  const actingAsThisVport = useMemo(() => {
    return (
      identity?.type === "vport" &&
      identity?.vportId &&
      conversation?.vport_id &&
      identity.vportId === conversation.vport_id
    );
  }, [identity?.type, identity?.vportId, conversation?.vport_id]);

  // ---- derive UI ------------------------------------------------------------
  const title = useMemo(() => {
    if (actingAsThisVport) {
      const p = partnerProfile;
      return p?.display_name || p?.username || "User";
    }
    return conversation?.vport?.name || "Conversation";
  }, [actingAsThisVport, partnerProfile, conversation?.vport?.name]);

  const subtitle = useMemo(() => {
    if (actingAsThisVport) {
      const p = partnerProfile;
      return p?.username ? `@${p.username}` : "";
    }
    return ""; // as a user we already show the VPORT name as title
  }, [actingAsThisVport, partnerProfile]);

  const avatarUrl = actingAsThisVport
    ? partnerProfile?.photo_url || null
    : conversation?.vport?.avatar_url || null;

  if (!conversationId) return null;

  // ---- render ---------------------------------------------------------------
  return (
    <header className="flex items-center gap-3 px-4 py-2 border-b border-neutral-200 bg-white">
      {/* avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover border border-neutral-200"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-300" />
      )}

      {/* title + subtitle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to={`/vchat/${conversation?.id || conversationId}`}
            className="font-semibold text-gray-900 truncate"
            title={title}
          >
            {loading ? "Loading…" : title}
          </Link>
        </div>
        {!loading && subtitle && (
          <span className="text-sm text-gray-500 truncate" title={subtitle}>
            {subtitle}
          </span>
        )}
        {err && (
          <div className="text-xs text-red-600 mt-0.5 truncate" title={err}>
            {err}
          </div>
        )}
      </div>
    </header>
  );
}
