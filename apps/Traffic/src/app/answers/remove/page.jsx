import { RemoveQuestionByTokenView } from "@/features/answers/screens/RemoveQuestionByToken.view";

// Confirm page for anonymous question removal. The one-time token travels in the
// ?t= query string and is read/validated entirely client-side, so this page is
// a single static export with no dynamic route params. It is noindex — it is a
// transactional action surface, not content.
export const metadata = {
  title: "Remove question — TRAZE Answers",
  robots: { index: false, follow: false }
};

export default function RemoveQuestionPage() {
  return <RemoveQuestionByTokenView />;
}
