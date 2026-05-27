// Public adapter surface for the dashboard/qrcode feature.
// All cross-feature imports must route through this file — never import
// from dashboard/qrcode/components/* directly.
export { QrCode } from "@/features/dashboard/qrcode/components/QrCode";
export { QrCard } from "@/features/dashboard/qrcode/components/QrCard";
export { ClassicFlyer } from "@/features/dashboard/qrcode/components/flyer/ClassicFlyer";
export { PosterFlyer } from "@/features/dashboard/qrcode/components/flyer/PosterFlyer";
