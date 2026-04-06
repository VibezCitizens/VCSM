import React from 'react'

export default function InboxListSkeleton({ count = 7 }) {
  return (
    <div className="space-y-2 px-2 py-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`inbox-skeleton:${i}`}
          className="module-modern-card chat-modern-card rounded-2xl px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-700/45" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-slate-700/45" />
                <div className="h-3 w-44 max-w-[70vw] animate-pulse rounded bg-slate-700/35" />
              </div>
            </div>

            <div className="h-[18px] w-7 animate-pulse rounded-full bg-slate-700/35" />
          </div>
        </div>
      ))}
    </div>
  )
}
