import React from "react";
import MediaCarousel from "@/features/post/postcard/components/MediaCarousel";
import { PostModuleCta } from "@/features/post/postcard/postModules/shared/components/PostModuleCta";
import { PostModuleFrame } from "@/features/post/postcard/postModules/shared/components/PostModuleFrame";
import { PostModuleHeader } from "@/features/post/postcard/postModules/shared/components/PostModuleHeader";
import { parseBarbershopPortfolioPostModule } from "@/features/post/postcard/postModules/barbershopPortfolio/barbershopPortfolioPostModule.model";
import "@/features/post/postcard/postModules/barbershopPortfolio/barbershopPortfolioPostModule.css";

export function BarbershopPortfolioPostModule({ text, payload = null, media, actorRoute, prioritizeMedia }) {
  const { actorName, portfolioTitle, vportKind } = parseBarbershopPortfolioPostModule(text, payload);
  const isBarber = vportKind === "barber";

  return (
    <PostModuleFrame
      className={isBarber ? "barber-portfolio-module" : "barbershop-portfolio-module"}
      ariaLabel={isBarber ? "Barber portfolio" : "Barbershop portfolio"}
    >
      <PostModuleHeader kicker={isBarber ? "Barber Work" : "New Work"} title={portfolioTitle ?? actorName} />
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
      <PostModuleCta to={actorRoute}>View portfolio</PostModuleCta>
    </PostModuleFrame>
  );
}
