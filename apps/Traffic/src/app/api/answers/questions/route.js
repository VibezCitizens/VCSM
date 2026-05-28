import { submitQuestion } from "@/features/answers/controller/submitQuestion.controller";

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        status: "invalid",
        errors: { form: "Invalid request body." }
      },
      { status: 400 }
    );
  }

  const result = await submitQuestion(body);
  return Response.json(result, { status: result.ok ? 201 : 400 });
}
