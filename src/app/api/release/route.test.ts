import { afterEach, describe, expect, it } from "vitest";

const ENV_KEY = "NEXT_PUBLIC_APP_RELEASE_ID";

afterEach(() => {
  delete process.env[ENV_KEY];
});

async function importRoute() {
  return await import("./route");
}

describe("GET /api/release", () => {
  it("returns the active release identity as plain JSON", async () => {
    process.env[ENV_KEY] = "release-xyz-789";

    const response = await (await importRoute()).GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      releaseId: "release-xyz-789",
    });
  });

  it("sets explicit no-store response headers", async () => {
    process.env[ENV_KEY] = "release-xyz-789";

    const response = await (await importRoute()).GET();

    const cacheControl = response.headers.get("cache-control");
    expect(cacheControl).not.toBeNull();
    expect(cacheControl!.toLowerCase()).toContain("no-store");
    expect(cacheControl!.toLowerCase()).toContain("no-cache");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("expires")).toBe("0");
  });

  it("does not require authentication to read the release identity", async () => {
    process.env[ENV_KEY] = "release-public";

    const response = await (await importRoute()).GET();

    expect(response.status).toBe(200);
    // The endpoint does not consult the user session; no redirect or
    // 401 should be possible.
    expect(response.headers.get("location")).toBeNull();
    await expect(response.json()).resolves.toEqual({
      releaseId: "release-public",
    });
  });

  it("disables release comparison when production metadata is missing", async () => {
    delete process.env[ENV_KEY];

    const response = await (await importRoute()).GET();

    // Returning an empty identity lets the client recognize the missing
    // state without a 404 or a redirect, and without reporting a false
    // update.
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ releaseId: null });
  });
});
