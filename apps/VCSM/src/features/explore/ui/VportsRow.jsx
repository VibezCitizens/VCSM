export default function VportsRow() {
  return (
    <section className="explore-discovery-card px-1">
      <h2 className="explore-discovery-title">Trending Vports</h2>

      <div className="flex flex-col gap-2">
        {[
          { id: 1, name: 'VPORT Cafe', category: 'Food & Drink' },
          { id: 2, name: 'Neon Cuts', category: 'Salon & Barber' },
          { id: 3, name: 'Byte Gym', category: 'Fitness Club' },
        ].map((vport) => (
          <div
            key={vport.id}
            className="rounded-lg flex items-center gap-3 p-3 transition border border-purple-300/15 bg-black/45 hover:border-purple-200/25"
          >
            <div className="w-12 h-12 rounded-md bg-white/6 flex-shrink-0" />

            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-white">
                {vport.name}
              </p>
              <p className="text-[11px] text-white/70/70 truncate">
                {vport.category}
              </p>
            </div>

            <button className="ml-auto text-xs px-3 py-1 rounded-full border border-purple-200/22 bg-purple-500/15 text-white">
              Visit
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
