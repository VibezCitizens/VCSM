import { Plus, X } from 'lucide-react'

import Card from '@/features/settings/ui/Card'
import CreateVportForm from '@/features/vport/CreateVportForm.jsx'
import OnemoredaysAd from '@/features/ads/widgets/OnemoredaysAd'

import { useVportsController } from '../controller/Vports.controller'

export default function VportsTabView() {
  const {
    items,
    setItems,
    busy,
    setBusy,
    showCreator,
    setShowCreator,
    activeActor,
    profileActorId,
    switchToProfile,
    switchToVport,
  } = useVportsController()

  return (
    <div className="space-y-5">
      <Card>
        <div className="mb-3 text-sm font-semibold text-slate-100">Your Profile</div>
        <button
          onClick={() => switchToProfile(profileActorId, setBusy)}
          disabled={busy || activeActor === 'profile'}
          className={[
            'settings-vport-row w-full px-4 py-3 text-left',
            'flex items-center justify-between rounded-xl',
            activeActor === 'profile' ? 'is-active' : '',
            busy ? 'cursor-wait opacity-60' : '',
          ].join(' ')}
        >
          <span className="font-medium text-slate-100">
            {activeActor === 'profile' ? 'Current Profile' : 'Switch to My Profile'}
          </span>
          <span className="settings-vport-tag px-2 py-0.5 text-[10px] uppercase">Profile</span>
        </button>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-100">Your VPORTs</div>
          <button onClick={() => setShowCreator(true)} className="settings-btn settings-btn--ghost inline-flex items-center gap-2 px-3 py-1.5 text-xs">
            <Plus className="h-4 w-4" />
            Create VPORT
          </button>
        </div>

        {!items.length ? (
          <div className="settings-card-surface rounded-xl px-4 py-3 text-sm text-slate-400">
            You do not own any VPORTs yet.
          </div>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0">
            {items.map((v) => {
              const isActive = activeActor === `vport:${v.id}`
              return (
                <li
                  key={v.id}
                  className={[
                    'settings-vport-row flex w-full items-center justify-between rounded-xl px-3 py-2.5',
                    isActive ? 'is-active' : '',
                  ].join(' ')}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={v.avatar_url || '/avatar.jpg'}
                      alt=""
                      className="h-10 w-10 rounded-lg border border-slate-300/20 object-cover"
                    />
                    <div className="min-w-0 text-[1rem] font-medium text-slate-100 truncate">{v.name}</div>
                  </div>

                  <button
                    onClick={() => switchToVport(v, setBusy)}
                    disabled={busy || isActive}
                    className={[
                      'settings-btn settings-btn--ghost border px-3 py-1.5 text-xs',
                      isActive ? 'opacity-90' : '',
                    ].join(' ')}
                  >
                    {isActive ? 'Current' : 'Switch'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <OnemoredaysAd />

      {showCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreator(false)} />
          <div className="settings-shell relative w-full max-w-[560px] rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-300/10 px-4 py-3">
              <div className="text-sm font-semibold text-slate-100">Create a VPORT</div>
              <button onClick={() => setShowCreator(false)} className="settings-btn settings-btn--ghost p-1.5 text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <CreateVportForm
                onCreated={({ list }) => {
                  if (Array.isArray(list)) setItems(list)
                  setShowCreator(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
