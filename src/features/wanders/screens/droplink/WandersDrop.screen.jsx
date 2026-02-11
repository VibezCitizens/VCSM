import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";
import GenericCardBuilder from "../components/GenericCardBuilder";
import { sendCardViaDropLink } from "../controllers/wandersDropSend.controller";

function safeTrim(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export default function WandersDropScreen() {
  const navigate = useNavigate();
  const params = useParams();

  const dropPublicId = useMemo(() => safeTrim(params.publicId), [params.publicId]);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sentCardPublicId, setSentCardPublicId] = useState("");

  const onSubmit = async (payload) => {
    // payload from GenericCardBuilder -> you already build: { templateKey, messageText, customization, ... }
    const templateKey = payload?.templateKey || payload?.template_key;
    const messageText = payload?.messageText || payload?.message_text || null;
    const customization = payload?.customization || {};

    if (!dropPublicId) return;
    if (!templateKey) throw new Error("Missing templateKey");

    setSending(true);
    setError(null);
    try {
      const res = await Promise.resolve(
        sendCardViaDropLink({
          dropPublicId,
          templateKey,
          messageText,
          customization,
        })
      );

      const newPublicId = safeTrim(res?.card_public_id);
      setSentCardPublicId(newPublicId);
    } catch (e) {
      console.error("[WandersDrop] send failed", e);
      setError(String(e?.message || e));
    } finally {
      setSending(false);
    }
  };

  if (!dropPublicId) {
    return <WandersEmptyState title="Invalid link" subtitle="Missing drop link id." />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="mb-4">
          <div className="text-xl font-bold">Send a Wander 💌</div>
          <div className="mt-1 text-sm text-zinc-300">
            Drop an anonymous card — you won’t see their inbox.
          </div>
        </div>

        {error ? (
          <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {sentCardPublicId ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-lg font-bold">Sent ✅</div>
            <div className="mt-1 text-sm text-zinc-300">
              Your card was delivered.
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSentCardPublicId("");
                  setError(null);
                }}
                className="rounded-xl bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-white/90"
              >
                Send another
              </button>

              <button
                type="button"
                onClick={() => navigate(`/wanders/c/${sentCardPublicId}`)}
                className="rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm font-semibold hover:bg-white/10"
              >
                View your card
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <GenericCardBuilder
              presetKey="wanders"
              showCardTypePicker={false}
              loading={sending}
              error={error}
              onSubmit={onSubmit}
            />
            {sending ? <div className="mt-3"><WandersLoading /></div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
