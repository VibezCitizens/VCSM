// src/features/post/postcard/ui/EditPost.jsx

import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { editPostController } from "@/features/post/postcard/controller/editPost.controller";
import { useIdentity } from "@/state/identity/identityContext";
import "@/features/ui/modern/module-modern.css";
import "@/features/post/styles/post-modern.css";
import "@/features/profiles/styles/profiles-modern.css";

export default function EditPostScreen() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { identity } = useIdentity();

  const initialText = state?.initialText ?? "";
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const trimmedText = useMemo(() => String(text ?? "").trim(), [text]);
  const canSave = Boolean(identity?.actorId) && !loading && trimmedText.length > 0;

  const handleSave = async () => {
    if (!identity?.actorId) {
      setError(new Error("Sign in required"));
      return;
    }

    setLoading(true);
    setError(null);

    const { ok, error: saveError } = await editPostController({
      actorId: identity.actorId,
      postId,
      text: trimmedText,
    });

    setLoading(false);

    if (!ok) {
      setError(saveError);
      return;
    }

    navigate(-1);
  };

  return (
    <div className="module-modern-page post-modern profiles-modern h-full w-full overflow-y-auto touch-auto">
      <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4">
        <div className="post-card module-modern-shell rounded-2xl p-4 sm:p-5">
          <h1 className="text-lg font-semibold text-slate-100">Edit Vibe</h1>
          <p className="mt-1 text-xs text-slate-400">Update your caption text.</p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            className="module-modern-input mt-4 min-h-[180px] w-full resize-y rounded-2xl px-3 py-3 text-base leading-6"
            placeholder="Share your vibe..."
          />

          {error ? (
            <p className="mt-2 text-sm text-rose-300">{String(error?.message ?? error)}</p>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="module-modern-btn module-modern-btn--primary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="module-modern-btn module-modern-btn--ghost px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
