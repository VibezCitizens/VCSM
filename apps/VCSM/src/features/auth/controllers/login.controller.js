import {
  dalGetAuthUser,
  dalSignInWithPassword,
  dalSignOut,
} from "@/features/auth/dal/login.dal";

export async function signInWithPassword({ email, password }) {
  const { data, error } = await dalSignInWithPassword({ email, password });
  if (error) throw error;
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
}
