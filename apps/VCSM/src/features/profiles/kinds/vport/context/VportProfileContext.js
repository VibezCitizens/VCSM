import { createContext, useContext } from "react";

const VportProfileContext = createContext(null);

export function useVportProfileContext() {
  const ctx = useContext(VportProfileContext);
  if (!ctx) throw new Error("useVportProfileContext must be used inside VportProfileContext.Provider");
  return ctx;
}

// Non-throwing variant for surfaces that may render outside the provider
// (e.g. the owner dashboard, which supplies `mode` directly as a prop).
export function useVportProfileContextOptional() {
  return useContext(VportProfileContext);
}

export { VportProfileContext };
