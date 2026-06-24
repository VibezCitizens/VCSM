// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — claim funnel Tailwind class helpers.
// Self-contained so the claim feature does not import auth-feature internals.

export function claimInputClass(disabled) {
  return [
    'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white',
    'placeholder:text-[#9ca3af] outline-none transition duration-200',
    'focus:border-[#6C4DF6]/80 focus:ring-2 focus:ring-[#6C4DF6]/40',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  ].join(' ')
}

export function claimSelectClass(disabled) {
  return claimInputClass(disabled)
}

export const claimPrimaryButtonClass = [
  'w-full rounded-xl bg-[#6C4DF6] px-4 py-2.5 text-sm font-semibold text-white',
  'transition duration-200 hover:bg-[#5b3fe0] disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

export const claimSecondaryButtonClass = [
  'w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white',
  'transition duration-200 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

export const claimLabelClass = 'text-xs font-medium tracking-wide text-[#d1d5db]'

export const claimFieldErrorClass = 'text-xs text-[#fca5a5]'
