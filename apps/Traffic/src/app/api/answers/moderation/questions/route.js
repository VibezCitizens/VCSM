import {
  listAnswersModerationQueue,
  moderateQuestion,
  validateModerationRequest
} from "@/features/answers/adapters/answers.adapter";

export async function POST(request) {
  const auth = validateModerationRequest(request);
  if (!auth.ok) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.id && body.action) {
    const result = await moderateQuestion({
      id: body.id,
      action: body.action,
      note: body.note
    });
    return Response.json(result, { status: result.ok ? 200 : 400 });
  }

  const result = await listAnswersModerationQueue();
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
