// src/state/IdentityMount.jsx
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { IdentityProvider } from "@/state/identityContext";

export default function IdentityMount({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return <IdentityProvider>{children}</IdentityProvider>;
}
