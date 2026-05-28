import { AnswersModerationView } from "@/features/answers/adapters/answers.adapter";

export const metadata = {
  title: "TRAZE Answers Moderation",
  robots: {
    index: false,
    follow: false
  }
};

export default function AnswersModerationPage() {
  return <AnswersModerationView />;
}
