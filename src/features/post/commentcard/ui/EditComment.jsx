// src/features/post/commentcard/ui/EditComment.jsx

import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { editCommentController } from "@/features/post/commentcard/controller/editComment.controller";
import { useIdentity } from "@/state/identity/identityContext";

export default function EditCommentScreen() {
  const { commentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { identity } = useIdentity();

  const initialText = state?.initialText ?? "";
  const [text, setText] = useState(initialText);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const { ok, error } = await editCommentController({
      actorId: identity.actorId,
      commentId,
      text,
    });

    setLoading(false);

    if (!ok) {
      setError(error);
      return;
    }

    navigate(-1);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-lg font-semibold mb-3">Edit Spark</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full bg-neutral-900 text-white border border-neutral-700 rounded p-2"
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
