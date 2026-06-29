// TICKET-TRAZE-CLAIM-LANDING-001 — public claim/create landing (search-first).
//
// Rendered for the claim funnel when NO provider reference is supplied (the
// global TRAZE CTAs + the /claim-business · /reclamar-negocio routes). The owner
// searches for their existing business to claim it, creates a brand-new profile,
// or signs in. It NEVER submits a claim — selecting a result hands off to the
// referenced /claim-profile flow, which owns submission.

import { useClaimBusinessSearch } from '@/features/claim/hooks/useClaimBusinessSearch'
import {
  claimInputClass,
  claimPrimaryButtonClass,
  claimSecondaryButtonClass,
} from '@/features/claim/components/claimStyles'

const COPY = {
  en: {
    title: 'Claim or create your business profile',
    subtitle:
      'Search for your business to claim it, create a new profile, or sign in if you already have an account.',
    inputPlaceholder: 'Search your business name',
    inputLabel: 'Search your business name',
    searching: 'Searching…',
    errorTitle: 'Search is unavailable right now.',
    errorBody: 'Please try again, or create a new business profile below.',
    noResultsTitle: 'No matching business found.',
    noResultsBody: "Can't find it? Create a new business profile below.",
    idleHint: 'Start typing your business name to find your listing.',
    alreadyClaimed: 'Already claimed',
    create: 'Create a new business profile',
    haveAccount: 'I already have an account',
  },
  es: {
    title: 'Reclama o crea el perfil de tu negocio',
    subtitle:
      'Busca tu negocio para reclamarlo, crea un perfil nuevo, o inicia sesión si ya tienes una cuenta.',
    inputPlaceholder: 'Busca el nombre de tu negocio',
    inputLabel: 'Busca el nombre de tu negocio',
    searching: 'Buscando…',
    errorTitle: 'La búsqueda no está disponible ahora.',
    errorBody: 'Inténtalo de nuevo, o crea un perfil de negocio nuevo abajo.',
    noResultsTitle: 'No se encontró ningún negocio.',
    noResultsBody: '¿No lo encuentras? Crea un perfil de negocio nuevo abajo.',
    idleHint: 'Escribe el nombre de tu negocio para encontrar tu ficha.',
    alreadyClaimed: 'Ya reclamado',
    create: 'Crear un perfil de negocio nuevo',
    haveAccount: 'Ya tengo una cuenta',
  },
}

function ProviderResult({ provider, claimedLabel, onSelect }) {
  const avatar = provider?.avatar_url || '/avatar.jpg'
  const location = provider?.city_name || provider?.address_text || null
  const claimed = provider?.claim_status === 'claimed' || Boolean(provider?.claimed_by)

  const inner = (
    <>
      <img
        src={avatar}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-white/12 object-cover"
        onError={(e) => {
          if (e.currentTarget.src.endsWith('/avatar.jpg')) return
          e.currentTarget.src = '/avatar.jpg'
        }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">
          {provider?.display_name || provider?.slug}
        </span>
        {location ? (
          <span className="block truncate text-xs text-[#9ca3af]">{location}</span>
        ) : null}
      </span>
      {claimed ? (
        <span className="shrink-0 rounded-md bg-white/[0.06] px-2 py-1 text-[0.65rem] font-medium text-[#9ca3af]">
          {claimedLabel}
        </span>
      ) : null}
    </>
  )

  const baseClass =
    'flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left'

  if (claimed) {
    return (
      <div className={`${baseClass} cursor-not-allowed opacity-60`} aria-disabled="true">
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`${baseClass} transition duration-200 hover:bg-white/[0.06]`}
      onClick={() => onSelect(provider)}
    >
      {inner}
    </button>
  )
}

export default function ClaimBusinessSearch({
  lang = 'en',
  onSelectProvider,
  onCreateBusiness,
  onLogin,
}) {
  const t = COPY[lang] || COPY.en
  const { query, setQuery, results, status, showEmpty } = useClaimBusinessSearch()

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-white">
          {t.title}
        </h1>
        <p className="text-sm text-[#9ca3af]">{t.subtitle}</p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          className={claimInputClass(false)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.inputPlaceholder}
          aria-label={t.inputLabel}
          autoFocus
        />

        <div aria-live="polite" className="space-y-2">
          {status === 'searching' ? (
            <p className="text-xs text-[#9ca3af]">{t.searching}</p>
          ) : null}

          {status === 'error' ? (
            <div className="text-xs text-[#fca5a5]">
              <p>{t.errorTitle}</p>
              <p className="text-[#9ca3af]">{t.errorBody}</p>
            </div>
          ) : null}

          {showEmpty ? (
            <div className="text-xs text-[#9ca3af]">
              <p className="text-white">{t.noResultsTitle}</p>
              <p>{t.noResultsBody}</p>
            </div>
          ) : null}

          {status === 'idle' && query.trim().length < 2 ? (
            <p className="text-xs text-[#6b7280]">{t.idleHint}</p>
          ) : null}

          {results.length > 0 ? (
            <ul className="space-y-2">
              {results.map((provider) => (
                <li key={provider.id || provider.slug}>
                  <ProviderResult
                    provider={provider}
                    claimedLabel={t.alreadyClaimed}
                    onSelect={onSelectProvider}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          className={claimPrimaryButtonClass}
          onClick={onCreateBusiness}
        >
          {t.create}
        </button>

        <button
          type="button"
          className={claimSecondaryButtonClass}
          onClick={onLogin}
        >
          {t.haveAccount}
        </button>
      </div>
    </div>
  )
}
