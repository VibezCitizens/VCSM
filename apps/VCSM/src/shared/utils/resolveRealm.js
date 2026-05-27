// Realm IDs are configurable per deployment via environment variables.
// Fallback values are the platform defaults — suitable for local dev without .env setup.
// See apps/VCSM/.env.example for configuration guidance.
export const PUBLIC_REALM_ID =
  import.meta.env.VITE_PUBLIC_REALM_ID ?? "2d6c267f-9c43-48e4-aa5e-e0a0274e9bc2";

const VOID_REALM_ID =
  import.meta.env.VITE_VOID_REALM_ID ?? "a89b7753-1c6e-40dd-9b90-ab496258f1ff";

export function resolveRealm(isVoid) {
  return isVoid ? VOID_REALM_ID : PUBLIC_REALM_ID;
}
