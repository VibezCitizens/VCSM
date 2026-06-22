// Adapter boundary: exposes VPORT service catalog access to dashboard consumers.
// Do not import getVportServicesController directly from profiles internals — use this adapter.
export { default as getVportServicesController, invalidateVportServices } from "@/features/profiles/kinds/vport/controller/services/getVportServices.controller";
export { default as useVportServices } from "@/features/profiles/kinds/vport/hooks/services/useVportServices";
