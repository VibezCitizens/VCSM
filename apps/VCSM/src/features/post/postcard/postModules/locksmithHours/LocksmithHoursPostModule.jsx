import React from "react";
import { PostModuleCta } from "@/features/post/postcard/postModules/shared/components/PostModuleCta";
import { PostModuleFrame } from "@/features/post/postcard/postModules/shared/components/PostModuleFrame";
import { PostModuleHeader } from "@/features/post/postcard/postModules/shared/components/PostModuleHeader";
import { parseLocksmithHoursPostModule } from "@/features/post/postcard/postModules/locksmithHours/locksmithHoursPostModule.model";
import "@/features/post/postcard/postModules/locksmithHours/locksmithHoursPostModule.css";

export function LocksmithHoursPostModule({ text, payload = null, actorRoute }) {
  const { actorName, scheduleRows } = parseLocksmithHoursPostModule(text, payload);

  return (
    <PostModuleFrame className="locksmith-hours-module" ariaLabel="Locksmith hours">
      <PostModuleHeader kicker="Working Hours" title={actorName} />
      {scheduleRows.length > 0 ? (
        <div className="hours-module-schedule">
          {scheduleRows.map(({ day, range }) => (
            <div key={day} className="hours-module-row">
              <span className="hours-module-day">{day}</span>
              <span className="hours-module-range">{range}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="hours-module-empty">{text}</div>
      )}
      <PostModuleCta to={actorRoute}>Request service</PostModuleCta>
    </PostModuleFrame>
  );
}
