import Backbutton from "@/ui/components/Backbutton.jsx";

export default function BackHeader({ title, onBack }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-black/40 backdrop-blur-md">
      <Backbutton onClick={onBack} />

      <h2 className="text-white text-lg font-semibold">
        {title}
      </h2>
    </div>
  );
}
