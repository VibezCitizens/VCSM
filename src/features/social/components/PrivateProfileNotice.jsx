// src/features/social/components/PrivateProfileNotice.jsx

import PrivateProfileGate from "@/features/profiles/ui/PrivateProfileGate";

/**
 * ============================================================
 * PrivateProfileNotice (LEGACY ADAPTER)
 * ------------------------------------------------------------
 * This component exists ONLY to bridge older imports.
 *
 * It delegates rendering to the new PrivateProfileGate
 * while preserving backward compatibility.
 *
 * ❗ DO NOT add logic here.
 * ❗ DO NOT fetch data here.
 * ============================================================
 */
export default function PrivateProfileNotice({
  actor,
  onRequestFollow,
  canMessage = true,
}) {
  if (!actor) return null;

  return (
    <PrivateProfileGate
      actor={actor}
      onRequestFollow={onRequestFollow}
      canMessage={canMessage}
    />
  );
}
