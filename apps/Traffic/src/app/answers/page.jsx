import { AnswersIndexView } from "@/features/answers/adapters/answers.adapter";
import { buildDirectoryMetadata } from "@/seo/metadata";

export function buildAnswersMetadata(routeLocale = null) {
  return buildDirectoryMetadata({
    title: "TRAZE Answers",
    description: "Browse TRAZE service guides, provider questions, and local discovery answers.",
    path: "/answers",
    routeLocale
  });
}

export const metadata = buildAnswersMetadata();

export default function AnswersPage() {
  return <AnswersIndexView />;
}
