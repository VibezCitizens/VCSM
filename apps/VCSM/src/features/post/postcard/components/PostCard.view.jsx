// src/features/post/postcard/ui/PostCard.view.jsx
import React from "react";

import MediaCarousel from "../components/MediaCarousel";
import ReactionBar from "../components/ReactionBar";
import { FuelPricesPostModule } from "@/features/post/postcard/postModules/fuelPrices";
import { ExchangeRatesPostModule } from "@/features/post/postcard/postModules/exchangeRates";
import { MenuDropPostModule } from "@/features/post/postcard/postModules/menuDrop";
import { BarbershopPortfolioPostModule } from "@/features/post/postcard/postModules/barbershopPortfolio";
import { BarbershopHoursPostModule } from "@/features/post/postcard/postModules/barbershopHours";
import { LocksmithPortfolioPostModule } from "@/features/post/postcard/postModules/locksmithPortfolio";
import { LocksmithHoursPostModule } from "@/features/post/postcard/postModules/locksmithHours";
import { LocksmithServiceAreaPostModule } from "@/features/post/postcard/postModules/locksmithServiceArea";

import { usePostCommentCount } from "@/features/post/commentcard/adapters/commentcard.adapter";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

const HAS_PRELOADED = (post) =>
  post && typeof post.commentCount === "number" && post.reactionCounts != null;

import LinkifiedMentions from "@/features/upload/adapters/ui/LinkifiedMentions.adapter";
import PostHeader from "../components/PostHeader";
import { useActorSummary } from "@/state/actors/useActorSummary";
import "@/features/post/styles/post-modern.css";

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
  const isExchangePost = postType === "exchange_rate_update";
  const isMenuPost = postType === "menu_update";
  const isBarbershopPortfolioPost = postType === "barbershop_portfolio_update";
  const isBarbershopHoursPost = postType === "barbershop_hours_update";
  const isLocksmithPortfolioPost = postType === "locksmith_portfolio_update";
  const isLocksmithHoursPost = postType === "locksmith_hours_update";
  const isLocksmithServiceAreaPost = postType === "locksmith_service_area_update";
  const actorRoute = actorSummary?.route ?? null;
  const menuUrl = isMenuPost && actorRoute ? `${actorRoute}/menu` : null;

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
        <FuelPricesPostModule text={safePost.text} payload={safePost.payload ?? null} stationRoute={actorSummary?.route ?? null} />
      ) : isExchangePost ? (
        <ExchangeRatesPostModule text={safePost.text} payload={safePost.payload ?? null} exchangeRoute={actorSummary?.route ?? null} />
      ) : isMenuPost ? (
        <MenuDropPostModule
          text={safePost.text}
          payload={safePost.payload ?? null}
          media={safePost.media}
          menuUrl={menuUrl}
          prioritizeMedia={prioritizeMedia}
        />
      ) : isBarbershopPortfolioPost ? (
        <BarbershopPortfolioPostModule
          text={safePost.text}
          payload={safePost.payload ?? null}
          media={safePost.media}
          actorRoute={actorRoute}
          prioritizeMedia={prioritizeMedia}
        />
      ) : isBarbershopHoursPost ? (
        <BarbershopHoursPostModule
          text={safePost.text}
          payload={safePost.payload ?? null}
          actorRoute={actorRoute}
        />
      ) : isLocksmithPortfolioPost ? (
        <LocksmithPortfolioPostModule
          text={safePost.text}
          payload={safePost.payload ?? null}
          media={safePost.media}
          actorRoute={actorRoute}
          prioritizeMedia={prioritizeMedia}
        />
      ) : isLocksmithHoursPost ? (
        <LocksmithHoursPostModule
          text={safePost.text}
          payload={safePost.payload ?? null}
          actorRoute={actorRoute}
        />
      ) : isLocksmithServiceAreaPost ? (
        <LocksmithServiceAreaPostModule
          text={safePost.text}
          payload={safePost.payload ?? null}
          actorRoute={actorRoute}
        />
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
