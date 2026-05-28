import React from "react";
import MediaCarousel from "@/features/post/postcard/components/MediaCarousel";
import { PostModuleCta } from "@/features/post/postcard/postModules/shared/components/PostModuleCta";
import { PostModuleFrame } from "@/features/post/postcard/postModules/shared/components/PostModuleFrame";
import { PostModuleHeader } from "@/features/post/postcard/postModules/shared/components/PostModuleHeader";
import { parseLocksmithPortfolioPostModule } from "@/features/post/postcard/postModules/locksmithPortfolio/locksmithPortfolioPostModule.model";
import "@/features/post/postcard/postModules/locksmithPortfolio/locksmithPortfolioPostModule.css";

export function LocksmithPortfolioPostModule({ text, payload = null, media, actorRoute, prioritizeMedia }) {
  const { actorName, portfolioTitle, jobTypeLabel } = parseLocksmithPortfolioPostModule(text, payload);

  return (
    <PostModuleFrame className="locksmith-portfolio-module" ariaLabel="Locksmith portfolio">
      <PostModuleHeader
        kicker="Locksmith Work"
        title={portfolioTitle ?? actorName}
        meta={jobTypeLabel}
      />
      {media?.length > 0 ? (
        <div
          className="portfolio-module-media"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MediaCarousel media={media} prioritizeMedia={prioritizeMedia} />
        </div>
      ) : null}
      <PostModuleCta to={actorRoute}>View locksmith</PostModuleCta>
    </PostModuleFrame>
  );
}
