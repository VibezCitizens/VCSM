// TICKET-TRAZE-CLAIM-VPORT-007 (T7) — activation checklist for a connected VPORT.

import {
  computeActivationChecklist,
  checklistCompletion,
} from '@/features/claimOnboarding/model/claimOnboarding.model'

export default function ClaimActivationChecklist({ profile }) {
  const items = computeActivationChecklist(profile)
  const { done, total } = checklistCompletion(items)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Finish setting up</p>
        <span className="text-xs text-white/50">{done}/{total} complete</span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className={[
                'flex h-5 w-5 items-center justify-center rounded-md border text-[11px]',
                item.done
                  ? 'border-[#6C4DF6]/60 bg-[#6C4DF6]/30 text-white'
                  : 'border-white/15 bg-white/[0.02] text-white/40',
              ].join(' ')}
            >
              {item.done ? '✓' : ''}
            </span>
            <span className={item.done ? 'text-white/55 line-through' : 'text-white'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
