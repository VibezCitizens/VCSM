import React from "react";
import "@/features/post/postcard/postModules/shared/postModules.css";

export function PostModuleFrame({ children, className = "", ariaLabel }) {
  return (
    <div className={`post-module-frame ${className}`} onClick={(e) => e.stopPropagation()}>
      <section className="post-module-surface" aria-label={ariaLabel}>
        {children}
      </section>
    </div>
  );
}
