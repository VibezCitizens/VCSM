// src/features/post/commentcard/ui/EditComment.jsx

import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useEditCommentAction } from "@/features/post/commentcard/hooks/useEditCommentAction";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

export default function EditCommentScreen() {
  const { commentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { identity } = useIdentity();

  const initialText = state?.initialText ?? "";
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const editComment = useEditCommentAction({ actorId: identity?.actorId });

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const { ok, error: saveError } = await editComment({ commentId, text });
    setLoading(false);
    if (!ok) { setError(saveError); return; }
    navigate(-1);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-lg font-semibold mb-3">Edit Spark</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full bg-white/4 text-white border border-neutral-700 rounded p-2"
      />

      {error && <p className="text-red-400 mt-2">{error.message}</p>}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-purple-600 px-4 py-2 rounded text-white"
        >
          Save
        </button>

        <button
          onClick={() => navigate(-1)}
          className="border border-neutral-600 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
