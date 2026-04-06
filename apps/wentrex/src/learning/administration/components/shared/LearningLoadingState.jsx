import "@/learning/styles/learning.css";
import {
  InlineSkeleton,
  HomeSkeleton,
  OrganizationSkeleton,
  DetailSkeleton,
  SplitSkeleton,
  DashboardSkeleton,
} from "@/learning/administration/components/shared/LearningSkeletonVariants";

function renderVariant(variant, label) {
  switch (variant) {
    case "inline":
      return <InlineSkeleton label={label} />;
    case "home":
      return <HomeSkeleton />;
    case "organization":
      return <OrganizationSkeleton />;
    case "detail":
      return <DetailSkeleton />;
    case "split":
      return <SplitSkeleton />;
    case "dashboard":
    default:
      return <DashboardSkeleton />;
  }
}

export default function LearningLoadingState({
  label = "Loading...",
  variant = "dashboard",
}) {
  if (variant === "inline") {
    return renderVariant(variant, label);
  }

  return (
    <div style={{ width: "100%" }}>
      {renderVariant(variant, label)}
      {label ? (
        <div
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "var(--learning-muted-text)",
            textAlign: "center",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}
