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

type ParamSchema = { safeParse: (value: string) => { success: boolean } };

export async function parseRouteParamId(
  context: { params: Promise<{ id: string }> },
  schema: ParamSchema,
): Promise<string | Response>;
export async function parseRouteParamId(
  context: { params: Promise<Record<string, string>> },
  field: string,
  schema: ParamSchema,
): Promise<string | Response>;
export async function parseRouteParamId(
  context: { params: Promise<Record<string, string>> },
  fieldOrSchema: string | ParamSchema,
  schemaArg?: ParamSchema,
): Promise<string | Response> {
  const params = await context.params;
  if (typeof fieldOrSchema === "string") {
    const value = params[fieldOrSchema];
    if (!value) return httpErrors.notFound();
    if (!schemaArg) return httpErrors.notFound();
    return schemaArg.safeParse(value).success ? value : httpErrors.notFound();
  }
  const value = (params as { id?: string }).id;
  if (!value) return httpErrors.notFound();
  return fieldOrSchema.safeParse(value).success ? value : httpErrors.notFound();
}
