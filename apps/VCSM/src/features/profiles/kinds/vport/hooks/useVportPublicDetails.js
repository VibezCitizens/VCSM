// src/features/profiles/kinds/vport/hooks/useVportPublicDetails.js
//
// COMPATIBILITY SHIM — do not add new consumers here.
//
// This file is kept to avoid breaking any in-flight branch or cached import.
// The hook has been renamed to useVportDashboardDetails.
//
// For DASHBOARD surfaces import:
//   import { useVportDashboardDetails } from
//     '@/features/profiles/kinds/vport/adapters/hooks/useVportPublicDetails.adapter';
//
// For PUBLIC-facing surfaces (online menu, QR views, reviews page) use:
//   import { useVportPublicDetails } from
//     '@/features/public/vportMenu/adapters/vportMenu.adapter';

export { useVportDashboardDetails as useVportPublicDetails } from '@/features/profiles/kinds/vport/hooks/useVportDashboardDetails'
