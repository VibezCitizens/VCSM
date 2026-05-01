import { X } from 'lucide-react'
import CreateVportForm from '@/features/vport/adapters/CreateVportForm.jsx.adapter'

export function VportsCreateModal({ onClose, onCreated }) {
  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
        <div className="settings-shell relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl sm:max-h-[calc(100dvh-2rem)]">
          <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="text-sm font-semibold text-white">Create a VPORT</div>
            <button onClick={onClose} className="settings-btn settings-btn--ghost p-1.5 text-white/70">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-4 touch-pan-y">
            <CreateVportForm onCreated={onCreated} />
          </div>
        </div>
      </div>
    </div>
  )
}
