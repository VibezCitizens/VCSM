import React, { Suspense } from 'react'
import { useTranslation } from '@i18n'
import SearchScreen from '../ui/SearchScreen.view'
import '@/shared/styles/modern/module-modern.css'
import '@/features/explore/styles/explore-modern.css'

export default function ExploreScreen() {
  const { t } = useTranslation()

  return (
    <div
      className="module-modern-page explore-modern w-full flex flex-col overflow-hidden"
      style={{ height: 'calc(100dvh - 48px - env(safe-area-inset-top, 0px))' }}
    >
      <div className="w-full max-w-none sm:mx-auto sm:max-w-2xl flex flex-col flex-1 min-h-0">
        <Suspense fallback={<div className="p-4 text-center text-white/70">{t('explore.loading')}</div>}>
          <SearchScreen />
        </Suspense>
      </div>
    </div>
  )
}
