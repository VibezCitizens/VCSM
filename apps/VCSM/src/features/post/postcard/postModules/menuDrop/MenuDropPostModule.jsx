import React from "react";
import MediaCarousel from "@/features/post/postcard/components/MediaCarousel";
import { PostModuleCta } from "@/features/post/postcard/postModules/shared/components/PostModuleCta";
import { PostModuleFrame } from "@/features/post/postcard/postModules/shared/components/PostModuleFrame";
import { PostModuleHeader } from "@/features/post/postcard/postModules/shared/components/PostModuleHeader";
import { MenuDropHero } from "@/features/post/postcard/postModules/menuDrop/MenuDropHero";
import { parseMenuDropPostModule } from "@/features/post/postcard/postModules/menuDrop/menuDropPostModule.model";
import "@/features/post/postcard/postModules/menuDrop/menuDropPostModule.css";

export function MenuDropPostModule({ text, payload = null, media = [], menuUrl, prioritizeMedia = false }) {
  const data = parseMenuDropPostModule(text, payload);
  const hasDetails = Boolean(data.action && data.subject && data.itemName);

  return (
    <PostModuleFrame className="menu-module" ariaLabel="Menu update">
      <PostModuleHeader
        kicker="Menu drop"
        title={data.restaurantName || "Restaurant menu"}
        meta={hasDetails ? data.action : null}
        accent="var(--vc-accent-pink)"
      />

      {hasDetails ? (
        <MenuDropHero
          subject={data.subject}
          itemName={data.itemName}
          categoryName={data.categoryName}
        />
      ) : (
        <div className="post-module-fallback">{text}</div>
      )}

      {media?.length > 0 ? (
        <div className="menu-module-media">
          <MediaCarousel media={media} prioritizeMedia={prioritizeMedia} />
        </div>
      ) : null}

      <PostModuleCta to={menuUrl}>View full menu</PostModuleCta>
    </PostModuleFrame>
  );
}
