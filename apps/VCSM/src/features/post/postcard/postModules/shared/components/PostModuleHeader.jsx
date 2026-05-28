import React from "react";

export function PostModuleHeader({ kicker, title, meta = null, accent = null }) {
  return (
    <div className="post-module-header">
      <div>
        {kicker ? (
          <div className="post-module-kicker" style={accent ? { color: accent } : undefined}>
            {kicker}
          </div>
        ) : null}
        {title ? <div className="post-module-title">{title}</div> : null}
      </div>
      {meta ? <div className="post-module-meta">{meta}</div> : null}
    </div>
  );
}
