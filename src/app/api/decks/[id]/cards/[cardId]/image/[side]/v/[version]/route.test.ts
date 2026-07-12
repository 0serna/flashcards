import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getDb: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  resolveOwnedCardImage: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/decks/service", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/cards/service", () => ({
  resolveOwnedCardImage: mocks.resolveOwnedCardImage,
}));

import { GET } from "./route";

const deckId = "123e4567-e89b-12d3-a456-426614174000";
const cardId = "550e8400-e29b-41d4-a716-446655440000";
const version = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

function routeParams(
  overrides: Partial<{ side: string; version: string }> = {},
) {
  return {
    params: Promise.resolve({
      id: deckId,
      cardId,
      side: overrides.side ?? "front",
      version: overrides.version ?? version,
    }),
  };
}

const ownedImage = {
  path: `${deckId}/${cardId}/front/${version}-photo.png`,
};

function makeRequest() {
  return new Request(
    `http://localhost/api/decks/${deckId}/cards/${cardId}/image/front/v/${version}`,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockReturnValue({});
  mocks.createClient.mockResolvedValue({
    storage: {
      from: () => ({
        download: vi.fn(async () => ({
          data: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }),
          error: null,
        })),
      }),
    },
  });
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.resolveOwnedCardImage.mockResolvedValue(ownedImage);
});

describe("GET /api/decks/[id]/cards/[cardId]/image/[side]/v/[version]", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(makeRequest(), routeParams());

    expect(response.status).toBe(401);
    expect(mocks.resolveOwnedCardImage).not.toHaveBeenCalled();
  });

  it("returns the private image for an owner of an active deck", async () => {
    const response = await GET(makeRequest(), routeParams());

    expect(response.status).toBe(200);
    expect(mocks.resolveOwnedCardImage).toHaveBeenCalledWith(
      {},
      "user-1",
      deckId,
      cardId,
      "front",
      version,
    );
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=2592000",
    );
  });

  it("preserves Storage content type when the object name has a mismatched extension", async () => {
    mocks.resolveOwnedCardImage.mockResolvedValue({
      path: `${deckId}/${cardId}/back/${version}-misnamed.jpg`,
    });

    const response = await GET(makeRequest(), routeParams({ side: "back" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=2592000",
    );
  });

  it("allows archived cards when the deck is still active and owned", async () => {
    // resolveOwnedCardImage is allowed to return a result for an archived
    // card; the route itself should not filter further.
    mocks.resolveOwnedCardImage.mockResolvedValue(ownedImage);

    const response = await GET(makeRequest(), routeParams());

    expect(response.status).toBe(200);
  });

  it("returns 404 when the lookup rejects an unauthenticated deck", async () => {
    mocks.resolveOwnedCardImage.mockResolvedValue(null);

    const response = await GET(makeRequest(), routeParams());

    expect(response.status).toBe(404);
  });

  it("returns 404 when the version does not match the current side image", async () => {
    mocks.resolveOwnedCardImage.mockResolvedValue(null);

    const response = await GET(
      makeRequest(),
      routeParams({ version: "00000000-0000-0000-0000-000000000000" }),
    );

    expect(response.status).toBe(404);
  });

  it.each(["not-a-uuid", "------------------------------------"])(
    "returns 404 for malformed UUID version %s",
    async (malformedVersion) => {
      const response = await GET(
        makeRequest(),
        routeParams({ version: malformedVersion }),
      );

      expect(response.status).toBe(404);
      expect(mocks.resolveOwnedCardImage).not.toHaveBeenCalled();
    },
  );

  it("returns 404 for an unsupported side segment", async () => {
    const response = await GET(makeRequest(), routeParams({ side: "bottom" }));

    expect(response.status).toBe(404);
    expect(mocks.resolveOwnedCardImage).not.toHaveBeenCalled();
  });

  it("returns 404 when Storage fails to download the object", async () => {
    mocks.createClient.mockResolvedValue({
      storage: {
        from: () => ({
          download: vi.fn(async () => ({
            data: null,
            error: { message: "not found" },
          })),
        }),
      },
    });

    const response = await GET(makeRequest(), routeParams());

    expect(response.status).toBe(404);
  });
});
