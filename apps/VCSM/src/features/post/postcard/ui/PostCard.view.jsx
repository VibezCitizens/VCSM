// src/features/post/postcard/ui/PostCard.view.jsx
import React from "react";

import MediaCarousel from "../components/MediaCarousel";
import ReactionBar from "../components/ReactionBar";

import { usePostCommentCount } from "@/features/post/commentcard/hooks/usePostCommentCount";
import { useIdentity } from "@/state/identity/identityContext";

const HAS_PRELOADED = (post) =>
  post && typeof post.commentCount === "number" && post.reactionCounts != null;

import { Link } from "react-router-dom";
import LinkifiedMentions from "@/features/upload/adapters/ui/LinkifiedMentions.adapter";
import PostHeader from "../components/PostHeader";
import { useActorSummary } from "@/state/actors/useActorSummary";
import "@/features/post/styles/post-modern.css";

const FUEL_COLORS = {
  Regular:   "#60a5fa",
  "Mid-Grade": "#a78bfa",
  Premium:   "#f472b6",
  Diesel:    "#fb923c",
  E85:       "#34d399",
  Kerosene:  "#facc15",
};

function parseFuelPriceText(text) {
  const parts = (text ?? "").split("\n\n");
  const stationLine = (parts[0] ?? "").replace(/^Fuel prices updated at\s*/i, "").trim();
  const lines = (parts[1] ?? "").split("\n").filter(Boolean);
  const prices = lines.map((line) => {
    const m = line.match(/^(.+?):\s+(\w+)\s+([\d.]+)\s+\/\s+(.+)$/);
    if (!m) return null;
    return { label: m[1].trim(), currency: m[2], price: m[3], unit: m[4].trim() };
  }).filter(Boolean);
  return { stationLine, prices };
}

function FuelPriceBoard({ text, stationRoute }) {
  const { stationLine, prices } = parseFuelPriceText(text);

  return (
    <div style={{ padding: "0 16px 14px" }}>
      {stationLine ? (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginBottom: 10, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Fuel prices — {stationLine}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 2, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
        {prices.map((p, i) => {
          const accent = FUEL_COLORS[p.label] ?? "rgba(255,255,255,0.6)";
          return (
            <div
              key={p.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 16, borderRadius: 99, background: accent, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{p.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                  {p.currency === "USD" ? "$" : p.currency}{p.price}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>
                  /{p.unit === "liter" ? "L" : p.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {stationRoute ? (
        <div style={{ marginTop: 10 }}>
          <Link
            to={stationRoute}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "10px 16px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(251,146,60,0.18) 0%, rgba(234,179,8,0.14) 100%)",
              border: "1px solid rgba(251,146,60,0.30)",
              boxShadow: "0 2px 10px rgba(251,146,60,0.10), inset 0 1px 0 rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.90)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            View station
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function PostCardView({
  post,
  onOpenPost,
  onOpenMenu,
  onShare,
  prioritizeMedia = false,

  covered = false,
  cover = null,
}) {
  const safePost = post ?? {};

  const { identity } = useIdentity();
  const viewerActorId = identity?.actorId ?? null;

  const preloaded = HAS_PRELOADED(safePost);
  const hookCommentCount = usePostCommentCount(preloaded ? null : safePost.id);
  const commentCount = preloaded ? safePost.commentCount : hookCommentCount;

  const locationText = String(safePost.location_text ?? safePost.locationText ?? "").trim();
  const createdAt = safePost.created_at ?? safePost.createdAt ?? null;
  const isOwner = !!viewerActorId && safePost.actorId === viewerActorId;

  const actorSummary = useActorSummary(safePost.actorId);
  const postType = safePost.post_type ?? "post";
  const isFuelPost = postType === "fuel_price_update";
  const isMenuPost = postType === "menu_update";
  const menuUrl = isMenuPost && actorSummary?.route ? `${actorSummary.route}/menu` : null;

  if (!post) return null;

  return (
    <div
      className="
        post-modern post-card profiles-card
        w-full
        rounded-2xl shadow-sm
        overflow-hidden
        relative
        transition-transform duration-200
        hover:-translate-y-[1px]
        hover:shadow-[0_16px_34px_rgba(0,0,0,0.35)]
      "
    >
      {covered ? (
        <div
          className="absolute inset-0 z-20"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {cover}
        </div>
      ) : null}

      <PostHeader
        actor={safePost.actorId}
        createdAt={createdAt}
        locationText={locationText}
        postId={safePost.id}
        onOpenPost={covered ? undefined : onOpenPost}
        onOpenMenu={({ postId, postActorId, anchorRect }) => {
          if (covered) return;
          onOpenMenu?.({ postId, postActorId, viewerActorId, isOwner, anchorRect });
        }}
      />

      {isFuelPost ? (
        <div onClick={(e) => e.stopPropagation()}>
          <FuelPriceBoard text={safePost.text} stationRoute={actorSummary?.route ?? null} />
        </div>
      ) : (
        <>
          {safePost.text ? (
            <div
              onClick={covered ? undefined : onOpenPost}
              className="px-4 pb-3 text-sm text-white/95 whitespace-pre-line cursor-pointer"
            >
              <LinkifiedMentions text={safePost.text} mentionMap={safePost.mentionMap || {}} />
            </div>
          ) : null}

          {safePost.media?.length > 0 ? (
            <div
              className="px-0 mb-2"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MediaCarousel media={safePost.media} prioritizeMedia={prioritizeMedia} />
            </div>
          ) : null}

          {menuUrl ? (
            <div style={{ padding: "0 16px 14px" }} onClick={(e) => e.stopPropagation()}>
              <Link
                to={menuUrl}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(79,70,229,0.18) 100%)",
                  border: "1px solid rgba(139,92,246,0.35)",
                  boxShadow: "0 2px 12px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.92)",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                }}
              >
                View full menu
              </Link>
            </div>
          ) : null}
        </>
      )}

      <div className="px-4 pb-3">
        <div
          onClickCapture={(e) => {
            if (!covered) return;
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDownCapture={(e) => {
            if (!covered) return;
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStartCapture={(e) => {
            if (!covered) return;
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <ReactionBar
            postId={safePost.id}
            commentCount={commentCount}
            onOpenComments={covered ? undefined : onOpenPost}
            onShare={covered ? undefined : onShare}
            preloadedReaction={preloaded ? safePost.viewerReaction : null}
            preloadedCounts={preloaded ? safePost.reactionCounts : null}
          />
        </div>
      </div>
    </div>
  );
}
