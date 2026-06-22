import { useIdentity } from '@/features/identity/identityContext'
import { canCitizenBook } from '@/features/identity/identitySelectors'

/**
 * Public identity hook for citizen booking eligibility (IDENTITY-BOUNDARY-007).
 * Wraps the canCitizenBook selector so consumers reach eligibility through the
 * identity adapter instead of importing the selector directly (adapter-boundary
 * compliance). Returns true only for citizen/user actors.
 */
export function useCanCitizenBook() {
  const { identity } = useIdentity()
  return canCitizenBook(identity)
}
