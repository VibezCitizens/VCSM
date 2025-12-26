// src/features/post/postcard/components/PostBody.jsx

import React from "react";

export default function PostBody({ text }) {
  if (!text) return null;

  return (
    <div className="px-1 mt-3">
      <p className="text-neutral-200 text-sm whitespace-pre-wrap leading-relaxed">
        {text}
      </p>
    </div>
  );
}
