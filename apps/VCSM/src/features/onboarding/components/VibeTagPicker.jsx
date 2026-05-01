import { useMemo } from 'react'
import { authTheme } from '@/features/auth/adapters/auth.adapter'

const CATEGORY_ORDER = [
  'Music',
  'Food & Drink',
  'Lifestyle',
  'Creative',
  'Professional',
  'Fitness & Sports',
  'Personality & Habits',
  'Everyday Life',
  'Social & Events',
]

const S = {
  card: {
    background: authTheme.cardBackground,
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
    boxShadow: authTheme.cardShadow,
    padding: '20px 22px',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 10,
  },
  tagGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBase: {
    borderRadius: 999,
    border: '1px solid',
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tagSelected: {
    borderColor: 'rgba(167,139,250,0.60)',
    background: 'rgba(139,92,246,0.18)',
    color: '#c4b5fd',
  },
  tagUnselected: {
    borderColor: 'rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.65)',
  },
  empty: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    padding: '12px 0',
  },
  footer: {
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 10,
  },
  saveBtn: {
    width: '100%',
    borderRadius: 12,
    border: 'none',
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    color: '#fff',
    boxShadow: '0 4px 14px rgba(109,40,217,0.30)',
    transition: 'opacity 0.15s',
  },
  saveBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
}

export default function VibeTagPicker({
  tags = [],
  selectedTagIds = new Set(),
  onToggleTag,
  onSave,
  saving = false,
  minRequired = 0,
}) {
  const list = Array.isArray(tags) ? tags : []

  const grouped = useMemo(() => {
    const map = new Map()
    for (const tag of list) {
      const cat = tag.category || 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat).push(tag)
    }

    const ordered = []
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) {
        ordered.push({ category: cat, tags: map.get(cat) })
        map.delete(cat)
      }
    }
    for (const [cat, catTags] of map) {
      ordered.push({ category: cat, tags: catTags })
    }
    return ordered
  }, [list])

  const selectedCount = selectedTagIds?.size ?? 0
  const belowMin = minRequired > 0 && selectedCount < minRequired
  const canSave = !saving && !belowMin

  return (
    <div style={S.card}>
      {list.length === 0 ? (
        <p style={S.empty}>No tags available right now.</p>
      ) : (
        grouped.map(({ category, tags: catTags }) => (
          <div key={category} style={S.categorySection}>
            <p style={S.categoryLabel}>{category}</p>
            <div style={S.tagGrid}>
              {catTags.map((tag) => {
                const selected = selectedTagIds?.has?.(tag.id) === true
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggleTag?.(tag.id)}
                    style={{
                      ...S.tagBase,
                      ...(selected ? S.tagSelected : S.tagUnselected),
                    }}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}

      <div style={S.footer}>
        {belowMin && (
          <p style={S.hint}>
            Select at least {minRequired} tag{minRequired !== 1 ? 's' : ''} to continue
            {selectedCount > 0 ? ` (${minRequired - selectedCount} more)` : ''}
          </p>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          style={{ ...S.saveBtn, ...(!canSave ? S.saveBtnDisabled : {}) }}
        >
          {saving ? 'Saving…' : 'Save tags'}
        </button>
      </div>
    </div>
  )
}
