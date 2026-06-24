// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — provider header for the claim screen.
// Display-only; the RPC remains the authority on claimability.

export default function ClaimProviderSummary({ provider, providerLabel }) {
  const avatar = provider?.avatar_url || '/avatar.jpg'
  const location = provider?.city_name || provider?.address_text || null

  return (
    <div className="mb-5 flex items-center gap-3">
      <img
        src={avatar}
        alt=""
        className="h-12 w-12 rounded-lg border border-white/12 object-cover"
        onError={(e) => {
          if (e.currentTarget.src.endsWith('/avatar.jpg')) return
          e.currentTarget.src = '/avatar.jpg'
        }}
      />
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-white">{providerLabel}</p>
        {location ? (
          <p className="truncate text-xs text-[#9ca3af]">{location}</p>
        ) : null}
      </div>
    </div>
  )
}
