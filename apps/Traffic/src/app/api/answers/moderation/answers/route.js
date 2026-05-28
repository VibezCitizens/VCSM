import {
  createModerationAnswer,
  moderateAnswer
} from "@/features/answers/controller/moderateAnswers.controller";
import { validateModerationRequest } from "@/features/answers/model/moderationAuth.model";

export async function POST(request) {
  const auth = validateModerationRequest(request);
  if (!auth.ok) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.id && body.action) {
    const result = await moderateAnswer({
      id: body.id,
      action: body.action,
      note: body.note
    });
    return Response.json(result, { status: result.ok ? 200 : 400 });
  }

  const result = await createModerationAnswer(body);
  return Response.json(result, { status: result.ok ? 201 : 400 });
}
