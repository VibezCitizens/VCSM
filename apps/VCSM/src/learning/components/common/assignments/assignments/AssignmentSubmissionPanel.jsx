import { useState } from "react";

export default function AssignmentSubmissionPanel({
  assignment,
  submission,
  capabilities,
  onSaveDraft,
  onSubmit,
}) {
  const [text, setText] = useState(submission?.submittedText || "");
  const [url, setUrl] = useState(submission?.submittedUrl || "");

  const canSubmit = capabilities?.canSubmitAssignments;

  return (
    <div className="border rounded-md p-4 flex flex-col gap-4">
      <h3 className="font-semibold">Your Submission</h3>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your submission..."
        className="w-full border rounded-md p-2 text-sm"
        rows={5}
        disabled={!canSubmit}
      />

      <input
        value={url || ""}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Optional URL"
        className="w-full border rounded-md p-2 text-sm"
        disabled={!canSubmit}
      />

      {canSubmit && (
        <div className="flex gap-2">
          <button
            onClick={() => onSaveDraft?.({ submittedText: text, submittedUrl: url })}
            className="px-3 py-2 text-sm border rounded-md"
          >
            Save Draft
          </button>

          <button
            onClick={() => onSubmit?.()}
            className="px-3 py-2 text-sm bg-black text-white rounded-md"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}