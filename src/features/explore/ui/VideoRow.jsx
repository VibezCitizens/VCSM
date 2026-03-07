export default function VideoRow() {
  return (
    <section className="explore-discovery-card px-4 opacity-85">
      <h2 className="explore-discovery-title">Videos (Coming Soon)</h2>

      <div className="flex gap-3 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[160px] h-[100px] rounded-xl flex items-center justify-center border border-dashed border-indigo-300/35 bg-slate-950/45"
          >
            <span className="text-xs text-slate-300/70">
              Phase 2
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
