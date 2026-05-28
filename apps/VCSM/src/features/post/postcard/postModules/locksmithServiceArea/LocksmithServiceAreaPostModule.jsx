import React from "react";
import { PostModuleCta } from "@/features/post/postcard/postModules/shared/components/PostModuleCta";
import { PostModuleFrame } from "@/features/post/postcard/postModules/shared/components/PostModuleFrame";
import { PostModuleHeader } from "@/features/post/postcard/postModules/shared/components/PostModuleHeader";
import { parseLocksmithServiceAreaPostModule } from "@/features/post/postcard/postModules/locksmithServiceArea/locksmithServiceAreaPostModule.model";
import "@/features/post/postcard/postModules/locksmithServiceArea/locksmithServiceAreaPostModule.css";

export function LocksmithServiceAreaPostModule({ text, payload = null, actorRoute }) {
  const { actorName, locationText, isEmergencyCovered } = parseLocksmithServiceAreaPostModule(
    text,
    payload
  );

  return (
    <PostModuleFrame
      className={`locksmith-service-area-module${isEmergencyCovered ? " emergency" : ""}`}
      ariaLabel="Locksmith service area"
    >
      <PostModuleHeader
        kicker="Service Area"
        title={locationText ?? actorName}
        meta={isEmergencyCovered ? "Emergency" : null}
        accent={isEmergencyCovered ? "#ef4444" : null}
      />
      {isEmergencyCovered ? (
        <div className="emergency-badge">Emergency service available</div>
      ) : null}
      <PostModuleCta to={actorRoute}>
        {isEmergencyCovered ? "Request emergency service" : "View locksmith"}
      </PostModuleCta>
    </PostModuleFrame>
  );
}
