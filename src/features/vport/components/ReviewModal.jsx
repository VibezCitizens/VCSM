import { useState } from 'react';
import ReviewForm from './ReviewForm.jsx';

export default function ReviewModal({
  vportId,
  userId,         // optional; if omitted the form will read supabase.auth.getUser()
  isOwner = false, // if true, button is disabled (owners can't review themselves)
  onSubmitted,     // optional callback after successful save
  cta = 'Leave a Review',
}) {
  const [open, setOpen] = useState(false);

  const disabled = !userId && isOwner; // owner always disabled; if not signed in, the form will also guard
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isOwner}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition shadow
          ${isOwner ? 'bg-red-500/50 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
        title={isOwner ? "Owners can't review their own VPort" : 'Open review form'}
      >
        <span className="i-lucide:star h-4 w-4" />
        {cta}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-black/90 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-red-500">Leave a Review</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <ReviewForm
              vportId={vportId}
              userId={userId}
              onSubmitted={() => {
                setOpen(false);
                onSubmitted?.();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
