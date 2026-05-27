export { default as useBookingAvailability }       from "@/features/booking/hooks/useBookingAvailability";
export { default as useCreateBooking }             from "@/features/booking/hooks/useCreateBooking";
export { default as useManageAvailability }        from "@/features/booking/hooks/useManageAvailability";
export { default as useOwnerBookingResources }     from "@/features/booking/hooks/useOwnerBookingResources";
export { default as useEnsureOwnerBookingResource } from "@/features/booking/hooks/useEnsureOwnerBookingResource";
export { default as useBookingServiceProfiles }    from "@/features/booking/hooks/useBookingServiceProfiles";
export { default as useOrganizationWorkspace }     from "@/features/booking/hooks/useOrganizationWorkspace";
export { default as useOrganizationLocations }     from "@/features/booking/hooks/useOrganizationLocations";
export { default as useLocationResources }         from "@/features/booking/hooks/useLocationResources";
export { default as useResourceServiceOverrides }  from "@/features/booking/hooks/useResourceServiceOverrides";
export { default as useBookingContextResolver }    from "@/features/booking/hooks/useBookingContextResolver";
export { default as useQrLinks }                   from "@/features/booking/hooks/useQrLinks";

export { useBookingOps }     from "@/features/booking/hooks/useBookingOps";
export { useBookingServices } from "@/features/booking/hooks/useBookingServices";
export { default as useBookingHistory } from "@/features/booking/hooks/useBookingHistory";
// Approved §5.3 exception: shared cross-feature ownership assertion primitive (9 call sites across dashboard controllers).
export { default as assertActorOwnsVportActorController } from "@/features/booking/controller/assertActorOwnsVportActor.controller";
// Approved §5.3 exception: actor kind/void check for self-ownership shortcut in checkVportOwnership (1 call site, dashboard controller only).
export { default as getActorByIdDAL } from "@/features/booking/dal/getActorById.dal";
