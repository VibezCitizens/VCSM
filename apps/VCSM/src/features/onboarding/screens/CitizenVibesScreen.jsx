import { useNavigate } from 'react-router-dom'
import VibeTagPicker from '@/features/onboarding/components/VibeTagPicker'
import useOnboardingVibeTags from '@/features/onboarding/hooks/useOnboardingVibeTags'

function VibeTagsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 space-y-3">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-700/50" />
        <div className="h-4 w-10/12 animate-pulse rounded bg-slate-700/40" />
        <div className="h-20 animate-pulse rounded bg-slate-800/60" />
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

  if (loading) return <VibeTagsSkeleton />

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
        <h1 className="text-lg font-semibold text-slate-100">Set your vibe tags</h1>
        <p className="mt-1 text-sm text-slate-300">
          Pick tags that represent you. You can update these later.
        </p>
        <p className="mt-2 text-xs text-slate-400">{selectedCount} selected</p>
      </header>

      {errorMessage && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <VibeTagPicker
        tags={tags}
        selectedTagIds={selectedTagIds}
        onToggleTag={toggleTag}
        onSave={save}
        saving={saving}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={reload}
          className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-200"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="rounded-xl bg-slate-700 px-3 py-2 text-xs text-slate-200"
        >
          Back
        </button>
      </div>
    </div>
  )
}
