import { authTheme } from '@/features/auth/styles/authTheme'

const S = {
  card: {
    background: authTheme.cardBackground,
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
    boxShadow: authTheme.cardShadow,
    padding: '20px 22px',
  },
  heading: {
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.70)',
    marginBottom: 16,
  },
  tagGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
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
  saveBtn: {
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
    opacity: 0.55,
    cursor: 'not-allowed',
  },
}

export default function VibeTagPicker({
  tags = [],
  selectedTagIds = new Set(),
  onToggleTag,
  onSave,
  saving = false,
}) {
  const list = Array.isArray(tags) ? tags : []

  return (
    <div style={S.card}>
      <p style={S.heading}>Select your vibe tags</p>

      {list.length === 0 ? (
        <p style={S.empty}>No tags available right now.</p>
      ) : (
        <div style={S.tagGrid}>
          {list.map((tag) => {
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
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={{ ...S.saveBtn, ...(saving ? S.saveBtnDisabled : {}) }}
      >
        {saving ? 'Saving…' : 'Save tags'}
      </button>
    </div>
  )
}
