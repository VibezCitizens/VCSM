// src/state/IdentityMount.jsx
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { IdentityProvider } from "@/state/identityContext";

export default function IdentityMount({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center">
        Loading…
      </div>
    );
  }

  // If user is not logged in, we still mount provider with user = null
  return <IdentityProvider user={user}>{children}</IdentityProvider>;
}
