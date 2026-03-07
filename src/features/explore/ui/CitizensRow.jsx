export default function CitizensRow() {
  return (
    <section className="explore-discovery-card px-1">
      <h2 className="explore-discovery-title">Vibez Citizens</h2>

      <div className="flex gap-3 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="min-w-[120px] rounded-xl p-3 flex flex-col items-center border border-indigo-300/20 bg-slate-950/45"
          >
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 mb-2" />

            <span className="text-xs truncate w-full text-center text-slate-100">
              Citizen_{i}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
