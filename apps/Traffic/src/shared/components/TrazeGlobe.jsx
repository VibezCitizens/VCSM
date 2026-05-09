"use client";

import TrazeGeoCoverageGlobe from "@/shared/components/TrazeGeoCoverageGlobe";

export default function TrazeGlobe({ coverage, ...props }) {
  if (!coverage) return null;
  return <TrazeGeoCoverageGlobe coverage={coverage} {...props} />;
}
