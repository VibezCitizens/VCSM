import { useState } from 'react'
import { useTranslation } from '@i18n'

export function VportDangerRow({ vport, onSoftDelete, onHardDelete, onRestore }) {
  const { t } = useTranslation()
  return (
    <div className="settings-danger-row rounded-xl p-3">
      <div className="flex items-center gap-3">
        <img
          src={vport.avatar_url || '/avatar.jpg'}
          alt={vport.name}
          className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-cover"
          onError={e => { e.currentTarget.src = '/avatar.jpg' }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate text-sm font-semibold text-rose-100">{vport.name}</span>
            {vport.is_deleted && (
              <span className="settings-status-badge settings-status-badge--inactive shrink-0">{t('settings.vport.deactivated')}</span>
            )}
          </div>
          <div className="truncate text-xs text-rose-100/50">@{vport.slug}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {vport.is_deleted ? (
            <>
              <button onClick={onRestore} className="settings-btn settings-btn--ghost px-2.5 py-1.5 text-xs">
                {t('settings.vport.restore')}
              </button>
              <button onClick={onHardDelete} className="settings-btn settings-btn--danger px-2.5 py-1.5 text-xs">
                {t('settings.vport.deletePermanently')}
              </button>
            </>
          ) : (
            <button
              onClick={onSoftDelete}
              className="settings-btn settings-btn--ghost px-2.5 py-1.5 text-xs"
              style={{ color: '#fcd34d', borderColor: 'rgba(217,119,6,0.35)' }}
            >
              {t('settings.vport.deactivateEllipsis')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function SoftDeleteModal({ vport, busy, onCancel, onConfirm }) {
  const { t } = useTranslation()
  return (
    <DeleteModal
      title={t('settings.vport.deactivateTitle')}
      busy={busy}
      busyLabel={t('settings.vport.deactivatingBusy')}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel={t('settings.vport.deactivateConfirm')}
      confirmClassName="settings-btn border border-amber-500/40 bg-amber-500/15 text-amber-300"
    >
      <p className="text-sm text-white/70">
        <span className="font-semibold text-white">{vport.name}</span>{' '}
        {t('settings.vport.deactivateBody')}
      </p>
    </DeleteModal>
  )
}

export function HardDeleteModal({ vport, busy, onCancel, onConfirm }) {
  const { t } = useTranslation()
  const [confirmText, setConfirmText] = useState('')
  const canConfirm = confirmText.trim() === vport.name.trim()

  return (
    <DeleteModal
      title={t('settings.vport.hardDeleteTitle')}
      busy={busy}
      busyLabel={t('settings.vport.deletingBusy')}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel={t('settings.vport.deletePermanently')}
      confirmDisabled={!canConfirm}
    >
      <p className="text-sm text-white/70">
        {t('settings.vport.hardDeleteBodyPre')}{' '}
        <span className="font-semibold text-white">{vport.name}</span>{' '}
        {t('settings.vport.hardDeleteBodyPost')}
      </p>
      <p className="mt-2 text-sm font-semibold text-rose-300">{t('settings.vport.hardDeletePermanent')}</p>
      <div className="mt-3 space-y-1.5">
        <label className="block text-xs text-white/50">
          {t('settings.vport.typeToConfirmPre')}{' '}
          <span className="font-semibold text-white/80">{vport.name}</span>{' '}
          {t('settings.vport.typeToConfirmPost')}
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={vport.name}
          className="settings-input w-full rounded-xl px-3 py-2 text-sm"
        />
      </div>
    </DeleteModal>
  )
}

export function RestoreModal({ vport, busy, onCancel, onConfirm }) {
  const { t } = useTranslation()
  return (
    <DeleteModal
      title={t('settings.vport.restoreTitle')}
      busy={busy}
      busyLabel={t('settings.vport.restoringBusy')}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel={t('settings.vport.restoreConfirm')}
      confirmClassName="settings-btn settings-btn--primary"
    >
      <p className="text-sm text-white/70">
        <span className="font-semibold text-white">{vport.name}</span>{' '}
        {t('settings.vport.restoreBody')}
      </p>
    </DeleteModal>
  )
}

export function DeleteModal({ title, busy, busyLabel, onCancel, onConfirm, confirmLabel, confirmClassName, confirmDisabled, children }) {
  const { t } = useTranslation()
  const btnClass = confirmClassName ?? 'settings-btn settings-btn--danger'
  const activeBusyLabel = busyLabel ?? t('settings.vport.deletingBusy')
  const isDisabled = busy || !!confirmDisabled

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="settings-shell mx-4 w-full max-w-md rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/8 p-4">
          <div className="text-sm font-semibold text-white">{title}</div>
          <button onClick={onCancel} disabled={busy} className="settings-btn settings-btn--ghost px-2 py-1 text-sm">✕</button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-white/8 p-4">
          <button onClick={onCancel} disabled={busy} className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm">{t('actions.cancel')}</button>
          <button
            onClick={onConfirm}
            disabled={isDisabled}
            className={`${btnClass} px-3 py-1.5 text-sm`}
            style={isDisabled ? { opacity: 0.45, cursor: 'not-allowed', transform: 'none' } : {}}
          >
            {busy ? activeBusyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DangerLabel() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#fca5a5" strokeWidth="1.6">
        <path d="M8 2L2 14h12L8 2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 7v3" strokeLinecap="round" />
        <circle cx="8" cy="12" r="0.6" fill="#fca5a5" stroke="none" />
      </svg>
      <span className="text-sm font-semibold text-rose-200/80">{t('settings.dangerZone')}</span>
    </div>
  )
}

export function Chevron({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 16 16"
      fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.6"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
