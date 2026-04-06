export default function LearningLoadingState({ label = "Loading..." }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black mb-4" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}