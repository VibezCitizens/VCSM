import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VibeTagPicker from '@/features/onboarding/components/VibeTagPicker'
import useOnboardingVibeTags from '@/features/onboarding/hooks/useOnboardingVibeTags'
import { authTheme } from '@/features/auth/adapters/auth.adapter'

const S = {
  page: {
    minHeight: '100dvh',
    background: authTheme.pageBackground,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px 48px',
  },
  inner: {
    width: '100%',
    maxWidth: 560,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  headerCard: {
    background: authTheme.cardBackground,
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
    boxShadow: authTheme.cardShadow,
    padding: '20px 22px',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.50)',
    lineHeight: 1.5,
    marginBottom: 8,
  },
  count: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
  errorCard: {
    background: 'rgba(239,68,68,0.10)',
    border: '1px solid rgba(239,68,68,0.30)',
    borderRadius: 14,
    padding: '12px 16px',
    fontSize: 13,
    color: '#fca5a5',
  },
  footerRow: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  ghostBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    color: 'rgba(255,255,255,0.70)',
    fontSize: 13,
    fontWeight: 500,
    padding: '10px 18px',
    cursor: 'pointer',
  },
}

function VibeTagsSkeleton() {
  return (
    <div style={S.page}>
      <div style={S.inner}>
        <div style={{ ...S.headerCard, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 20, width: 160, borderRadius: 6, background: 'rgba(255,255,255,0.08)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 14, width: '80%', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div style={{ ...S.headerCard, height: 120 }} />
      </div>
    </div>
  )
}

export default function CitizenVibesScreen() {
  const navigate = useNavigate()
  const {
    tags,
    selectedTagIds,
    selectedCount,
    loading,
    saving,
    errorMessage,
    toggleTag,
    save,
    reload,
  } = useOnboardingVibeTags()

  useEffect(() => {
    document.title = 'Vibe Tags — Vibez Citizens'
    return () => { document.title = 'Vibez Citizens' }
  }, [])

  if (loading) return <VibeTagsSkeleton />

  return (
    <div style={S.page}>
      <div style={S.inner}>
        <div style={S.headerCard}>
          <p style={S.title}>Set your vibe tags</p>
          <p style={S.subtitle}>Pick tags that represent you. You can update these later.</p>
          <p style={S.count}>{selectedCount} selected</p>
        </div>

        {errorMessage && (
          <div style={S.errorCard}>{errorMessage}</div>
        )}

        <VibeTagPicker
          tags={tags}
          selectedTagIds={selectedTagIds}
          onToggleTag={toggleTag}
          onSave={save}
          saving={saving}
          minRequired={3}
        />

        <div style={S.footerRow}>
          <button style={S.ghostBtn} type="button" onClick={reload}>Reload</button>
          <button style={S.ghostBtn} type="button" onClick={() => navigate('/explore')}>Back</button>
        </div>
      </div>
    </div>
  )
}
