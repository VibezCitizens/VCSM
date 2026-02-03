// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\upload\ui\LinkifiedMentions.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMentionRegex(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return null;

  const sorted = [...keys].filter(Boolean).sort((a, b) => b.length - a.length);
  const group = sorted.map(escapeRegex).join("|");

  return new RegExp(`(^|[^a-z0-9_-])(@)?(${group})(?=$|[^a-z0-9_-])`, "gi");
}

function getMentionTarget(entry) {
  if (!entry) return { href: null };

  if (typeof entry === "string") {
    return { href: `/profile/${entry}` };
  }

  const actorId = entry.actorId || entry.id || null;
  const href = entry.route || (actorId ? `/profile/${actorId}` : null);

  return { href };
}

export default function LinkifiedMentions({ text, mentionMap, className = "" }) {
  const safeText = String(text ?? "");
  const mentionKeys = useMemo(() => Object.keys(mentionMap || {}), [mentionMap]);

  const parts = useMemo(() => {
    const re = buildMentionRegex(mentionKeys);
    if (!re) return [{ type: "text", value: safeText }];

    const out = [];
    let lastIndex = 0;
    let m;

    while ((m = re.exec(safeText)) !== null) {
      const fullMatch = m[0] || "";
      const boundary = m[1] || "";
      const hasAt = !!m[2];
      const handleRaw = m[3] || "";

      const matchIndex = m.index;
      const boundaryLen = boundary ? boundary.length : 0;

      if (matchIndex > lastIndex) {
        out.push({ type: "text", value: safeText.slice(lastIndex, matchIndex) });
      }

      if (boundaryLen > 0) {
        out.push({ type: "text", value: boundary });
      }

      const tokenText = (hasAt ? "@" : "") + handleRaw;
      const key = String(handleRaw).toLowerCase();

      const entry = mentionMap?.[key] ?? null;
      const { href } = getMentionTarget(entry);

      if (href) {
        out.push({ type: "mention", value: tokenText, href, key });
      } else {
        out.push({ type: "text", value: tokenText });
      }

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < safeText.length) {
      out.push({ type: "text", value: safeText.slice(lastIndex) });
    }

    return out;
  }, [safeText, mentionMap, mentionKeys]);

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.type === "mention" ? (
          <Link
            key={`m:${p.key}:${i}`}
            to={p.href}
            style={{
              color: "#a78bfa",        // violet-ish
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#c4b5fd"; // hover violet
              e.currentTarget.style.textDecoration = "none";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#a78bfa";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {p.value}
          </Link>
        ) : (
          <span key={`t:${i}`}>{p.value}</span>
        )
      )}
    </span>
  );
}
