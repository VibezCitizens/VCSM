export default function VportsRow() {
  return (
    <section className="px-4">
      <h2 className="text-sm font-semibold mb-2">🏬 Trending VPORTs</h2>

      <div className="flex flex-col gap-2">
        {[
          { id: 1, name: 'VPORT Cafe', category: 'Food & Drink' },
          { id: 2, name: 'Neon Cuts', category: 'Salon & Barber' },
          { id: 3, name: 'Byte Gym', category: 'Fitness Club' }
        ].map(vport => (
          <div
            key={vport.id}
            className="bg-zinc-900 rounded-lg flex items-center gap-3 p-3 hover:bg-zinc-800 transition"
          >

            {/* Business Logo */}
            <div className="w-12 h-12 rounded-md bg-zinc-700 flex-shrink-0" />

            {/* Business Info */}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {vport.name}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">
                {vport.category}
              </p>
            </div>

            {/* CTA */}
            <button className="ml-auto text-xs bg-purple-600 text-white px-3 py-1 rounded-full">
              Visit
            </button>

          </div>
        ))}
      </div>
    </section>
  )
}
