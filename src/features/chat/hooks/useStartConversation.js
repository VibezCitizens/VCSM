import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

/**
 * Hook: start or open an existing 1-to-1 conversation instantly.
 * Works for user↔user, user↔vport, vport↔user, vport↔vport.
 *
 * @param {Object} options
 * @param {boolean} options.isVport - true if navigating within vport chat routes
 */
export default function useStartConversation({ isVport = false } = {}) {
  const navigate = useNavigate();

  async function startConversation(a1, a2) {
    if (!a1 || !a2) {
      console.warn("[useStartConversation] Missing actor IDs →", { a1, a2 });
      return;
    }

    // Call Supabase RPC
    const { data, error } = await supabase.rpc("vc_get_or_create_one_to_one", {
      a1,
      a2,
    });

    if (error) {
      console.error("[useStartConversation] RPC error:", error);
      alert(error.message);
      return;
    }

    const convoId = data;

    // Navigate directly to conversation view
    if (isVport) {
      navigate(`/vport/chat/${convoId}`);
    } else {
      navigate(`/chat/${convoId}`);
    }
  }

  return { startConversation };
}
