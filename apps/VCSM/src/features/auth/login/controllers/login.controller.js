import { validateEmail } from '@/features/auth/shared/model/authInputValidation.model'
import {
  dalGetAuthUser,
  dalSignInWithPassword,
  dalSignOut,
} from "@/features/auth/login/dal/login.dal";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring'
import {
  invalidateLegalDocsCache,
  invalidateConsentCache,
} from '@/features/legal/adapters/legal.adapter'

export async function signInWithPassword({ email, password }) {
  const normalizedEmail = validateEmail(email)
  const { data, error } = await dalSignInWithPassword({ email: normalizedEmail, password });
  if (error) {
    captureVcsmError({
      feature: 'auth',
      module: 'login.controller',
      severity: 'error',
      message: `signInWithPassword: dalSignInWithPassword failed — ${error?.message ?? 'unknown'}`,
      error_name: error?.name,
      operation: 'dalSignInWithPassword',
      is_handled: false,
    })
    throw error;
  }
  // Return only what callers need — tokens are managed by AuthProvider via onAuthStateChange
  return {
    data: {
      user: {
        id: data?.user?.id ?? null,
        email: data?.user?.email ?? null,
      },
    },
    error: null,
  };
}

export async function getAuthUser() {
  const { data, error } = await dalGetAuthUser();
  if (error) throw error;
  return data?.user ?? null;
}

export async function signOut() {
  const { error } = await dalSignOut();
  if (error) throw error;
  // Clear legal caches on logout so the next session re-fetches fresh consent state.
  // Prevents a subsequent user on the same device from inheriting cached consent.
  invalidateLegalDocsCache()
  invalidateConsentCache()
}
