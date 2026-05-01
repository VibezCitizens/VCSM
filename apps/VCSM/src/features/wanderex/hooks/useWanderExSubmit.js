import { useCallback, useState } from "react"
import { useWandersBusinessCardOps } from "@/features/wanders/core/adapters/wanders.adapter"

export function useWanderExSubmit({ slug, source = "business_card" } = {}) {
  const { submitLead } = useWandersBusinessCardOps()
  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(
    async ({ name, phone, email, message, userAgent }) => {
      setSubmitting(true)
      try {
        await submitLead({
          slug,
          name,
          phone,
          email,
          message,
          source,
          userAgent,
        })
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e }
      } finally {
        setSubmitting(false)
      }
    },
    [slug, source]
  )

  return { submitting, submit }
}
