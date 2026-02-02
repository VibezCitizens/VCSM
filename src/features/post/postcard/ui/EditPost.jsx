// src/features/post/postcard/ui/EditPost.jsx

import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { editPostController } from "@/features/post/postcard/controller/editPost.controller";
import { useIdentity } from "@/state/identity/identityContext";

export default function EditPostScreen() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { identity } = useIdentity();

  // ✅ this is the important part
  const initialText = state?.initialText ?? "";

  // ✅ seed textarea with previous text
  const [text, setText] = useState(initialText);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const { ok, error } = await editPostController({
      actorId: identity.actorId,
      postId,
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
      <h1 className="text-lg font-semibold mb-3">Edit Vibe</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
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
