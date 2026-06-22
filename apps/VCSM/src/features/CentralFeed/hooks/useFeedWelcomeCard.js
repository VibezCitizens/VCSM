import { useState, useEffect, useCallback } from 'react'
import {
  ctrlGetWelcomeCardVisible,
  ctrlMarkWelcomeCardSeen,
} from '@/features/CentralFeed/controllers/feedWelcomeCard.controller'

function lsKey(actorId) {
  return actorId ? `vcsm_wfc_${actorId}` : null
}

export function useFeedWelcomeCard({ actorId, kind }) {
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    // Only citizen actors see the welcome card
    if (!actorId || kind !== 'user') {
      setShow(false)
      setLoading(false)
      return
    }

    // localStorage fast-path avoids a DB round-trip on repeat visits
    const key = lsKey(actorId)
    if (key && localStorage.getItem(key) === 'dismissed') {
      setShow(false)
      setLoading(false)
      return
    }

    setLoading(true)
    ctrlGetWelcomeCardVisible({ actorId })
      .then(({ show: shouldShow }) => {
        if (!shouldShow && key) localStorage.setItem(key, 'dismissed')
        setShow(shouldShow)
      })
      .catch(() => setShow(false))
      .finally(() => setLoading(false))
  }, [actorId, kind])

  const dismiss = useCallback(() => {
    setShow(false)
    setModalOpen(false)
    const key = lsKey(actorId)
    if (key) localStorage.setItem(key, 'dismissed')
    if (actorId) ctrlMarkWelcomeCardSeen({ actorId }).catch(() => {})
  }, [actorId])

  return {
    show:      !loading && show,
    loading,
    dismiss,
    modalOpen,
    openModal:  () => setModalOpen(true),
    closeModal: () => setModalOpen(false),
  }
}
