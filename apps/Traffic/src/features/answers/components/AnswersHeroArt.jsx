// Decorative, pure-SVG hero visual for the Answers page. No raster asset, fixed
// aspect ratio (no layout shift), and fully aria-hidden — purely editorial.

const SANS = "'Inter', 'Helvetica Neue', Arial, system-ui, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

// Tiny decorative metric chip (no real data).
function MetricChip({ x, y, w, label }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height="22" rx="11" fill="url(#ahaGlass)" stroke="url(#ahaGlassEdge)" strokeWidth="0.75" />
      <circle cx="13" cy="11" r="2.6" fill="url(#ahaGold)" />
      <text x="24" y="15" fontFamily={SANS} fontSize="10.5" fontWeight="600" fill="#e7e9f5" fillOpacity="0.85">{label}</text>
    </g>
  );
}

export function AnswersHeroArt() {
  return (
    <svg
      className="answers-hero-art"
      viewBox="0 0 440 440"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* atmospheric depth glow: navy → purple → black */}
        <radialGradient id="ahaGlow" cx="46%" cy="38%" r="64%">
          <stop offset="0%" stopColor="#5b3aa6" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#241a4d" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#05060f" stopOpacity="0" />
        </radialGradient>

        {/* question-mark face */}
        <linearGradient id="ahaQ" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#d9ccff" />
          <stop offset="52%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>

        {/* muted metallic gold (light / mid / shadow / sheen / deep) */}
        <linearGradient id="ahaGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3e2ad" />
          <stop offset="34%" stopColor="#d7b160" />
          <stop offset="56%" stopColor="#a97e36" />
          <stop offset="78%" stopColor="#e4c478" />
          <stop offset="100%" stopColor="#8a6126" />
        </linearGradient>

        {/* dark-glass panel fill + edge */}
        <linearGradient id="ahaGlass" x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="55%" stopColor="#aab4d6" stopOpacity="0.045" />
          <stop offset="100%" stopColor="#0b1024" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id="ahaGlassEdge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.22" />
        </linearGradient>

        {/* brighter glass for the important "Published Answer" card */}
        <linearGradient id="ahaGlassHot" x1="0%" y1="0%" x2="16%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#c3b9ec" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#1a1340" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="ahaGlassHotEdge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3e2ad" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
        </linearGradient>

        {/* gold destination-node glow */}
        <radialGradient id="ahaNodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5d98a" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#d7b160" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#d7b160" stopOpacity="0" />
        </radialGradient>

        {/* soft drop shadows for depth separation */}
        <filter id="ahaSoft" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="13" floodColor="#2a0f57" floodOpacity="0.5" />
        </filter>
        <filter id="ahaCard" x="-45%" y="-45%" width="190%" height="190%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#04050d" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* ── Background: atmospheric glow ─────────────────────── */}
      <circle cx="210" cy="176" r="226" fill="url(#ahaGlow)" />

      {/* ── Overlapping orbits (motion-ready, slow rotation) ── */}
      <g className="answers-hero-art__orbits" fill="none" stroke="url(#ahaGold)">
        <ellipse cx="220" cy="216" rx="186" ry="122" strokeWidth="1" strokeOpacity="0.42" transform="rotate(-18 220 216)" />
        <ellipse cx="220" cy="216" rx="136" ry="184" strokeWidth="0.8" strokeOpacity="0.26" transform="rotate(20 220 216)" />
      </g>

      {/* ── Question-mark watermark (demoted, behind workflow) ── */}
      <text x="232" y="300" textAnchor="middle" fontFamily={SERIF} fontSize="168" fontWeight="700" fill="url(#ahaQ)" fillOpacity="0.1">?</text>

      {/* ── Knowledge network: faint spread links + nodes ─────── */}
      <g stroke="url(#ahaGold)" strokeWidth="0.8" strokeOpacity="0.22">
        <line x1="292" y1="266" x2="392" y2="150" />
        <line x1="292" y1="266" x2="60" y2="318" />
        <line x1="292" y1="266" x2="368" y2="372" />
      </g>
      <g fill="url(#ahaGold)" fillOpacity="0.55">
        <circle cx="392" cy="150" r="2.2" />
        <circle cx="60" cy="318" r="2" />
        <circle cx="368" cy="372" r="2.2" />
      </g>

      {/* ── Workflow flow lines (Question → Expert → Answer) ──── */}
      <g stroke="url(#ahaGold)" strokeWidth="1.4" strokeOpacity="0.6" fill="none" strokeLinecap="round">
        <path d="M198 122 C 226 150, 232 162, 250 184" />
        <path d="M312 232 C 320 250, 312 258, 298 264" />
      </g>

      {/* ── Workflow cards ──────────────────────────────────── */}
      <g filter="url(#ahaCard)">
        {/* 1 · Question */}
        <g transform="rotate(-3 132 84)">
          <rect x="48" y="44" width="168" height="80" rx="14" fill="url(#ahaGlass)" stroke="url(#ahaGlassEdge)" strokeWidth="1" />
          <text x="64" y="66" fontFamily={SANS} fontSize="11" fontWeight="700" letterSpacing="0.6" fill="url(#ahaGold)">Question</text>
          <line x1="64" y1="76" x2="200" y2="76" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />
          <line x1="64" y1="92" x2="192" y2="92" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" />
          <line x1="64" y1="106" x2="150" y2="106" stroke="#ffffff" strokeOpacity="0.11" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* 2 · Expert */}
        <g transform="rotate(3 329 191)">
          <rect x="250" y="150" width="158" height="82" rx="14" fill="url(#ahaGlass)" stroke="url(#ahaGlassEdge)" strokeWidth="1" />
          <text x="266" y="172" fontFamily={SANS} fontSize="11" fontWeight="700" letterSpacing="0.6" fill="url(#ahaGold)">Expert</text>
          <line x1="266" y1="182" x2="394" y2="182" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />
          <text x="266" y="200" fontFamily={SANS} fontSize="11.5" fontWeight="600" fill="#eef0fb" fillOpacity="0.9">Local Locksmith</text>
          <g transform="translate(266 210)">
            <rect width="70" height="16" rx="8" fill="none" stroke="url(#ahaGold)" strokeWidth="0.9" strokeOpacity="0.7" />
            <circle cx="11" cy="8" r="2.4" fill="url(#ahaGold)" />
            <text x="20" y="11.5" fontFamily={SANS} fontSize="8.5" fontWeight="700" letterSpacing="0.3" fill="url(#ahaGold)">VERIFIED</text>
          </g>
        </g>

        {/* 3 · Published Answer (larger, brighter, important) */}
        <g transform="rotate(-2 188 322)">
          <rect x="70" y="260" width="236" height="122" rx="16" fill="url(#ahaGlassHot)" stroke="url(#ahaGlassHotEdge)" strokeWidth="1.4" />
          <text x="92" y="288" fontFamily={SANS} fontSize="12" fontWeight="700" letterSpacing="0.5" fill="url(#ahaGold)">Published Answer</text>
          <line x1="92" y1="298" x2="284" y2="298" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1" />
          <g>
            <circle cx="98" cy="316" r="3" fill="url(#ahaGold)" />
            <line x1="110" y1="316" x2="272" y2="316" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" />
            <circle cx="98" cy="336" r="3" fill="url(#ahaGold)" />
            <line x1="110" y1="336" x2="252" y2="336" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="4" strokeLinecap="round" />
            <circle cx="98" cy="356" r="3" fill="url(#ahaGold)" />
            <line x1="110" y1="356" x2="262" y2="356" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
      </g>

      {/* ── Flow waypoint nodes ─────────────────────────────── */}
      <g fill="url(#ahaGold)">
        <circle cx="198" cy="122" r="7" fillOpacity="0.16" />
        <circle cx="198" cy="122" r="3" />
        <circle cx="250" cy="184" r="7" fillOpacity="0.16" />
        <circle cx="250" cy="184" r="3" />
        <circle cx="312" cy="232" r="7" fillOpacity="0.16" />
        <circle cx="312" cy="232" r="3" />
      </g>

      {/* ── Destination node = published knowledge + VC mark ─── */}
      <g transform="translate(292 266)">
        <circle cx="0" cy="0" r="30" fill="url(#ahaNodeGlow)" />
        <circle cx="0" cy="0" r="16" fill="#0a0d1b" stroke="url(#ahaGold)" strokeWidth="1.3" />
        <text x="0" y="5" textAnchor="middle" fontFamily={SERIF} fontSize="14" fontWeight="700" letterSpacing="0.4" fill="url(#ahaGold)">VC</text>
      </g>

      {/* ── Micro metrics (decorative; hidden on smaller screens) ── */}
      <g className="answers-hero-art__chips">
        <MetricChip x="296" y="26" w="92" label="124 Answers" />
        <MetricChip x="14" y="170" w="86" label="58 Experts" />
        <MetricChip x="322" y="398" w="74" label="6 Topics" />
      </g>
    </svg>
  );
}
