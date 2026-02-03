// src/features/upload/model/resolveRealm.js
const PUBLIC_REALM_ID = "2d6c267f-9c43-48e4-aa5e-e0a0274e9bc2";
const VOID_REALM_ID = "a89b7753-1c6e-40dd-9b90-ab496258f1ff";

/**
 * Model-ish pure translator:
 * - no I/O
 * - no Supabase
 */
export function resolveRealm(isVoid) {
  return isVoid ? VOID_REALM_ID : PUBLIC_REALM_ID;
}
