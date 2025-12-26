export default function VideoRow() {
  return (
    <section className="px-4 opacity-70">
      <h2 className="text-sm font-semibold mb-2">🎥 Videos (Coming Soon)</h2>

      <div className="flex gap-3 overflow-x-auto">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="min-w-[160px] h-[100px] bg-zinc-900 rounded-xl flex items-center justify-center border border-dashed border-zinc-700"
          >
            <span className="text-xs text-zinc-500">
              Phase 2
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
