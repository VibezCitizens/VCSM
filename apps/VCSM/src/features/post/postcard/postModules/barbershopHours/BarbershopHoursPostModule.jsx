import React from "react";
import { PostModuleCta } from "@/features/post/postcard/postModules/shared/components/PostModuleCta";
import { PostModuleFrame } from "@/features/post/postcard/postModules/shared/components/PostModuleFrame";
import { PostModuleHeader } from "@/features/post/postcard/postModules/shared/components/PostModuleHeader";
import { parseBarbershopHoursPostModule } from "@/features/post/postcard/postModules/barbershopHours/barbershopHoursPostModule.model";
import "@/features/post/postcard/postModules/barbershopHours/barbershopHoursPostModule.css";

export function BarbershopHoursPostModule({ text, payload = null, actorRoute }) {
  const { actorName, scheduleRows } = parseBarbershopHoursPostModule(text, payload);

  return (
    <PostModuleFrame className="barbershop-hours-module" ariaLabel="Barbershop hours">
      <PostModuleHeader kicker="Business Hours" title={actorName} />
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
      <PostModuleCta to={actorRoute}>Book now</PostModuleCta>
    </PostModuleFrame>
  );
}
