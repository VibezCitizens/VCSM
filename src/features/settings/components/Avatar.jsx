export default function Avatar({ url, name }) {
  return (
    <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center">
      {url ? (
        <img src={url} alt={name || 'avatar'} className="h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-400">
          <path fill="currentColor" d="M12 12a5 5 0 100-10 5 5 0 000 10Zm-7 9a7 7 0 0114 0v1H5v-1Z"/>
        </svg>
      )}
    </div>
  );
}
