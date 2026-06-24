// TICKET-TRAZE-CLAIM-VPORT-007 (T7) — first-run welcome card for an approved,
// connected business claim. Welcome → approved → connected → next actions.

import ClaimActivationChecklist from '@/features/claimOnboarding/components/ClaimActivationChecklist'

const PRIMARY = [
  'w-full rounded-xl bg-[#6C4DF6] px-4 py-2.5 text-sm font-semibold text-white',
  'transition duration-200 hover:bg-[#5b3fe0] disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

const SECONDARY = [
  'w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white',
  'transition duration-200 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

export default function ClaimApprovedWelcome({ item, busy, onGoToDashboard, onDismiss }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[#a78bfa]">Claim approved</p>
        <h1 className="text-[1.6rem] font-semibold tracking-tight text-white">
          Welcome to {item.vportName}
        </h1>
        <p className="text-sm text-white/60">
          Your claim for <span className="text-white">{item.businessName}</span> was approved and a
          managed business profile is now connected to your account.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs text-white/50">Business connected</p>
        <p className="mt-0.5 text-base font-semibold text-white">{item.vportName}</p>
        {item.vportSlug ? <p className="text-xs text-white/40">/{item.vportSlug}</p> : null}
      </div>

      <ClaimActivationChecklist profile={item.profile} />

      <div className="space-y-2.5">
        <button type="button" className={PRIMARY} onClick={onGoToDashboard} disabled={busy}>
          {busy ? 'Opening…' : 'Go to your business dashboard'}
        </button>
        <button type="button" className={SECONDARY} onClick={onDismiss} disabled={busy}>
          I will do this later
        </button>
      </div>
    </div>
  )
}
