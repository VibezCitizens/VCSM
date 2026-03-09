import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActorVibeTags } from '@/features/profiles/screens/views/tabs/tags/hooks/useActorVibeTags'

export default function ActorProfileTagsView({ actorId, canAddTag = false }) {
  const navigate = useNavigate()
  const { tags, loading, error } = useActorVibeTags(actorId)
  const [activeTagKey, setActiveTagKey] = useState(null)
  const activeKey = useMemo(
    () => activeTagKey || tags?.[0]?.key || null,
    [activeTagKey, tags]
  )

  if (loading) {
    return (
      <section className="profiles-tags-card p-5">
        <div className="h-5 w-20 rounded-full bg-white/10 animate-pulse" />
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[...Array(4)].map((_, index) => (
            <div
              key={`tag-skeleton:${index}`}
              className="h-8 w-24 shrink-0 rounded-full bg-white/10 animate-pulse"
            />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="profiles-tags-card profiles-error p-5 text-sm">
        Failed to load tags.
      </section>
    )
  }

  const tagList = tags

  return (
    <section className="profiles-tags-wrap">
      <div className="profiles-tags-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="profiles-tags-title">Tags</h3>
          <span className="text-[11px] uppercase tracking-[0.14em] text-slate-300/70">
            {tags.length} selected
          </span>
        </div>

        <div className="mt-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex min-w-full items-center gap-2.5">
            {tagList.length > 0 ? (
              tagList.map((tag) => {
                const isActive = activeKey === tag.key
                return (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => setActiveTagKey(tag.key)}
                    className={`profiles-tag-chip ${isActive ? 'is-active' : ''}`}
                    title={tag.description || tag.label}
                  >
                    {tag.label}
                  </button>
                )
              })
            ) : (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300/75">
                No tags yet
              </span>
            )}

            {canAddTag && (
              <button
                type="button"
                onClick={() => navigate('/citizen/vibes')}
                className="profiles-tag-chip profiles-tag-chip-add"
                aria-label="Add Tag"
              >
                + Add Tag
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
