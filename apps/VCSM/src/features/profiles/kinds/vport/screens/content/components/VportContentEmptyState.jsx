// src/features/profiles/kinds/vport/screens/content/components/VportContentEmptyState.jsx

export function VportContentEmptyState({ isOwner = false }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-4xl select-none opacity-40">📄</div>
      <div className="text-white/70 font-semibold text-base">
        {isOwner ? "No content pages yet" : "No content available"}
      </div>
      <div className="text-white/40 text-sm max-w-[240px] leading-relaxed">
        {isOwner
          ? "Create guides, FAQs, or tips to share with your customers."
          : "This business hasn't published any guides or FAQs yet."}
      </div>
    </div>
  );
}

export default VportContentEmptyState;
