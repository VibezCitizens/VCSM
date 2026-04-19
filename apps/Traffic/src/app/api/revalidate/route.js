import { revalidatePath, revalidateTag } from "next/cache";

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const output = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

function normalizePaths(value) {
  return normalizeStringArray(value).filter((entry) => entry.startsWith("/"));
}

export async function POST(request) {
  const expectedSecret = String(process.env.REVALIDATE_SECRET ?? "").trim();
  const providedSecret = String(request.headers.get("x-revalidate-secret") ?? "").trim();

  if (!expectedSecret) {
    return Response.json(
      { success: false, error: "Revalidation is not configured." },
      { status: 500 }
    );
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return Response.json(
      { success: false, error: "Unauthorized revalidation request." },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => null);
  const paths = normalizePaths(payload?.paths);
  const tags = normalizeStringArray(payload?.tags);

  if (!paths.length && !tags.length) {
    return Response.json(
      { success: false, error: "No valid paths or tags provided." },
      { status: 400 }
    );
  }

  const revalidated = [];

  for (const path of paths) {
    revalidatePath(path);
    revalidated.push({ type: "path", value: path });
  }

  for (const tag of tags) {
    revalidateTag(tag);
    revalidated.push({ type: "tag", value: tag });
  }

  return Response.json({
    success: true,
    revalidated
  });
}

export function GET() {
  return Response.json(
    {
      success: false,
      error: "Method not allowed. Use POST."
    },
    {
      status: 405,
      headers: {
        Allow: "POST"
      }
    }
  );
}
