import { readAnswerPage, readAnswersIndex } from "@/features/answers/controller/readAnswerPage.controller";

export async function useAnswerPage({ slug }) {
  return readAnswerPage({ slug });
}

export async function useAnswersIndex() {
  return readAnswersIndex({ limit: 20 });
}
