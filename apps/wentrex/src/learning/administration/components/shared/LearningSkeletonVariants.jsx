import React from "react";

export function SkeletonBlock({
  width = "100%",
  height = 16,
  radius = 10,
  style = {},
}) {
  return (
    <div
      className="learning-skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ children, style = {} }) {
  return (
    <div
      className="learning-card"
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "1 1 340px" }}>
        <SkeletonBlock width={230} height={34} radius={14} />
        <SkeletonBlock width={300} height={14} radius={999} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SkeletonBlock width={92} height={40} radius={999} />
        <SkeletonBlock width={108} height={40} radius={999} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="learning-loading-page">
      <HeaderSkeleton />

      <div className="learning-skeleton-stats">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={`dashboard-stat-${index}`} style={{ minHeight: 108 }}>
            <SkeletonBlock width="38%" height={12} radius={999} />
            <SkeletonBlock width="58%" height={30} radius={12} />
            <SkeletonBlock width="44%" height={12} radius={999} />
          </SkeletonCard>
        ))}
      </div>

      <div className="learning-skeleton-grid learning-skeleton-grid-two">
        <SkeletonCard style={{ minHeight: 240 }}>
          <SkeletonBlock width={180} height={20} radius={12} />
          <SkeletonBlock width="100%" height={14} radius={999} />
          <SkeletonBlock width="88%" height={14} radius={999} />
          <SkeletonBlock width="92%" height={14} radius={999} />
          <SkeletonBlock width="70%" height={14} radius={999} />
        </SkeletonCard>

        <SkeletonCard style={{ minHeight: 240 }}>
          <SkeletonBlock width={150} height={20} radius={12} />
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock
              key={`dashboard-row-${index}`}
              width="100%"
              height={48}
              radius={14}
            />
          ))}
        </SkeletonCard>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="learning-loading-page">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SkeletonBlock width={180} height={28} radius={999} />
        <SkeletonBlock width="min(640px, 100%)" height={48} radius={18} />
        <SkeletonBlock width="min(520px, 100%)" height={18} radius={999} />
      </div>

      <div className="learning-skeleton-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={`home-stat-${index}`} style={{ minHeight: 108 }}>
            <SkeletonBlock width="34%" height={12} radius={999} />
            <SkeletonBlock width="42%" height={30} radius={12} />
            <SkeletonBlock width="62%" height={12} radius={999} />
          </SkeletonCard>
        ))}
      </div>

      <div className="learning-skeleton-grid learning-skeleton-grid-cards">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={`home-card-${index}`} style={{ minHeight: 250 }}>
            <SkeletonBlock width={46} height={46} radius={14} />
            <SkeletonBlock width="52%" height={20} radius={12} />
            <SkeletonBlock width="100%" height={14} radius={999} />
            <SkeletonBlock width="92%" height={14} radius={999} />
            <SkeletonBlock width="100%" height={40} radius={12} />
            <SkeletonBlock width="100%" height={40} radius={12} />
            <SkeletonBlock width="72%" height={42} radius={12} style={{ marginTop: "auto" }} />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

export function OrganizationSkeleton() {
  return (
    <div className="learning-loading-page">
      <HeaderSkeleton />
      <SkeletonCard style={{ minHeight: 140 }}>
        <SkeletonBlock width={220} height={22} radius={12} />
        <SkeletonBlock width="96%" height={16} radius={999} />
        <SkeletonBlock width="90%" height={16} radius={999} />
        <SkeletonBlock width="84%" height={16} radius={999} />
      </SkeletonCard>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SkeletonBlock width={94} height={40} radius={999} />
        <SkeletonBlock width={100} height={40} radius={999} />
      </div>

      <div className="learning-skeleton-grid learning-skeleton-grid-two">
        <SkeletonCard style={{ minHeight: 280 }}>
          <SkeletonBlock width={180} height={20} radius={12} />
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock
              key={`organization-course-${index}`}
              width="100%"
              height={54}
              radius={14}
            />
          ))}
        </SkeletonCard>

        <SkeletonCard style={{ minHeight: 280 }}>
          <SkeletonBlock width={170} height={20} radius={12} />
          <SkeletonBlock width="100%" height={48} radius={12} />
          <SkeletonBlock width="100%" height={48} radius={12} />
          <SkeletonBlock width="100%" height={96} radius={16} />
        </SkeletonCard>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="learning-loading-page">
      <HeaderSkeleton />

      <SkeletonCard style={{ minHeight: 150 }}>
        <SkeletonBlock width={240} height={22} radius={12} />
        <SkeletonBlock width="100%" height={16} radius={999} />
        <SkeletonBlock width="88%" height={16} radius={999} />
        <SkeletonBlock width="72%" height={16} radius={999} />
      </SkeletonCard>

      <div className="learning-skeleton-grid learning-skeleton-grid-two">
        <SkeletonCard style={{ minHeight: 220 }}>
          <SkeletonBlock width={140} height={18} radius={12} />
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock
              key={`detail-left-${index}`}
              width="100%"
              height={16}
              radius={999}
            />
          ))}
        </SkeletonCard>

        <SkeletonCard style={{ minHeight: 220 }}>
          <SkeletonBlock width={160} height={18} radius={12} />
          <SkeletonBlock width="100%" height={56} radius={14} />
          <SkeletonBlock width="100%" height={56} radius={14} />
          <SkeletonBlock width="86%" height={16} radius={999} />
        </SkeletonCard>
      </div>
    </div>
  );
}

export function SplitSkeleton() {
  return (
    <div className="learning-loading-page">
      <HeaderSkeleton />

      <div
        className="learning-skeleton-grid learning-skeleton-grid-split"
        style={{ alignItems: "start" }}
      >
        <SkeletonCard style={{ minHeight: 420 }}>
          <SkeletonBlock width={180} height={20} radius={12} />
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock
              key={`split-list-${index}`}
              width="100%"
              height={54}
              radius={14}
            />
          ))}
        </SkeletonCard>

        <SkeletonCard style={{ minHeight: 420 }}>
          <SkeletonBlock width={220} height={20} radius={12} />
          <SkeletonBlock width="100%" height={110} radius={16} />
          <SkeletonBlock width="100%" height={56} radius={14} />
          <SkeletonBlock width="100%" height={56} radius={14} />
          <SkeletonBlock width="72%" height={42} radius={12} />
        </SkeletonCard>
      </div>
    </div>
  );
}

export function InlineSkeleton({ label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 12,
        background: "var(--learning-muted)",
        border: "1px solid var(--learning-border)",
      }}
    >
      <SkeletonBlock width={18} height={18} radius={999} style={{ flexShrink: 0 }} />
      <SkeletonBlock width={120} height={12} radius={999} style={{ flexShrink: 0 }} />
      {label ? (
        <span style={{ fontSize: 13, color: "var(--learning-muted-text)" }}>{label}</span>
      ) : null}
    </div>
  );
}
