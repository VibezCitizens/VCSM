import { readAnswerPage, readAnswersIndex } from "@/features/answers/controller/readAnswerPage.controller";

export async function fetchAnswerPage({ slug }) {
  return readAnswerPage({ slug });
}

export async function fetchAnswersIndex() {
  return readAnswersIndex({ limit: 20 });
}
