import { useCallback, useEffect, useState } from 'react'
import { getOnboardingCardsController } from '@/features/onboarding/controller/onboardingController'

export default function useOnboardingCards(actorId) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!actorId) {
      setCards([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getOnboardingCardsController({ actorId })
      if (!result?.ok) {
        console.error('[onboarding/cards] controller returned non-ok result', {
          actorId,
          result,
        })
        throw new Error(result?.error?.message || 'Failed to load onboarding cards')
      }

      setCards(result?.data?.cards ?? [])
    } catch (e) {
      console.error('[onboarding/cards] refresh failed', {
        actorId,
        message: e?.message ?? null,
        code: e?.code ?? null,
        details: e?.details ?? null,
        hint: e?.hint ?? null,
        stack: e?.stack ?? null,
        error: e,
      })
      setError(e)
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [actorId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    cards,
    loading,
    error,
    refresh,
  }
}
