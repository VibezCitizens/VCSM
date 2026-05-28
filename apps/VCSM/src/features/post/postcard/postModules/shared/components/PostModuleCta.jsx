import React from "react";
import { Link } from "react-router-dom";

export function PostModuleCta({ to, children }) {
  if (!to) return null;

  return (
    <Link className="post-module-cta" to={to}>
      {children}
    </Link>
  );
}
