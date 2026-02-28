export default function CitizensRow() {
  return (
    <section className="px-1">
      <h2 className="text-sm font-semibold mb-2">🔥 Vibez Citizens</h2>

      <div className="flex gap-3 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="min-w-[120px] bg-zinc-900 rounded-xl p-3 flex flex-col items-center"
          >

            {/* Square Avatar */}
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 mb-2" />

            {/* Name */}
            <span className="text-xs truncate w-full text-center">
              Citizen_{i}
            </span>

          </div>
        ))}
      </div>
    </section>
  )
}
