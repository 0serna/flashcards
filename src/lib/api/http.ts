export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export const httpErrors = {
  unauthorized: () => jsonError("Unauthorized", 401),
  notFound: () => jsonError("Not found", 404),
  badRequest: (message: string) => jsonError(message, 400),
};

export async function parseJsonBody(
  request: Request,
): Promise<unknown | Response> {
  try {
    return await request.json();
  } catch {
    return httpErrors.badRequest("Invalid JSON body");
  }
}
