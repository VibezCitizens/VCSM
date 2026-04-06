import React from "react";
import LinkifiedMentions from "@/features/upload/adapters/ui/LinkifiedMentions.adapter";

export default function PostBody({ text, mentionMap }) {
  if (!text) return null;

  return (
    <div className="px-1 mt-3">
      <p className="text-neutral-200 text-sm whitespace-pre-wrap leading-relaxed">
        <LinkifiedMentions text={text} mentionMap={mentionMap || {}} />
      </p>
    </div>
  );
}
