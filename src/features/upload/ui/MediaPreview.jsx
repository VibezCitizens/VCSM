export default function MediaPreview({ url, type }) {
  if (!url) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-neutral-700">
      {type === "video" ? (
        <video src={url} controls playsInline className="w-full h-auto" />
      ) : (
        <img src={url} className="w-full h-auto object-contain" />
      )}
    </div>
  );
}
