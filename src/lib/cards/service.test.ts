import { beforeEach, describe, expect, it } from "vitest";

import {
  createCard,
  deleteImage,
  signCardImages,
  toCard,
  updateCard,
} from "./service";

const supabaseState = {
  removals: [] as Array<{ paths: string[] }>,
  signedUrls: [] as Array<{
    path: string;
    transform?: { height: number; resize: "contain"; width: number };
  }>,
  uploads: [] as Array<{ path: string; type?: string }>,
};

function createMockSupabase(
  options: { signedUrl?: string | null; failUploadName?: string } = {},
) {
  return {
    storage: {
      from: () => ({
        createSignedUrl: async (
          path: string,
          _expiresIn: number,
          createSignedUrlOptions?: {
            transform?: { height: number; resize: "contain"; width: number };
          },
        ) => {
          supabaseState.signedUrls.push({
            path,
            transform: createSignedUrlOptions?.transform,
          });
          return {
            data:
              options.signedUrl === null
                ? null
                : { signedUrl: options.signedUrl ?? `signed:${path}` },
            error: null,
          };
        },
        upload: async (
          path: string,
          _bytes: Blob,
          uploadOptions: { contentType?: string },
        ) => {
          supabaseState.uploads.push({ path, type: uploadOptions.contentType });
          if (options.failUploadName && path.endsWith(options.failUploadName)) {
            return { data: null, error: { message: "Upload failed" } };
          }
          return { data: { path }, error: null };
        },
        remove: async (paths: string[]) => {
          supabaseState.removals.push({ paths });
          return { data: [], error: null };
        },
      }),
    },
  } as never;
}

beforeEach(() => {
  supabaseState.removals = [];
  supabaseState.signedUrls = [];
  supabaseState.uploads = [];
});

describe("signCardImages", () => {
  it("creates proportion-preserving preview URLs when a transform is requested", async () => {
    const supabase = createMockSupabase();

    await signCardImages(
      supabase,
      {
        id: "c1",
        deckId: "d1",
        frontText: null,
        frontImagePath: "deck/card/front/x.jpg",
        backText: null,
        backImagePath: "deck/card/back/x.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      },
      { width: 640, height: 480, resize: "contain" },
    );

    expect(supabaseState.signedUrls).toEqual([
      {
        path: "deck/card/front/x.jpg",
        transform: { width: 640, height: 480, resize: "contain" },
      },
      {
        path: "deck/card/back/x.jpg",
        transform: { width: 640, height: 480, resize: "contain" },
      },
    ]);
  });
});

describe("toCard", () => {
  it("returns null imageUrl when there is no path", async () => {
    const card = await toCard(
      {
        id: "c1",
        deckId: "d1",
        frontText: "Front",
        frontImagePath: null,
        backText: "Back",
        backImagePath: null,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        archivedAt: null,
      },
      { front: null, back: null },
    );
    expect(card.front.imageUrl).toBeNull();
    expect(card.back.imageUrl).toBeNull();
  });

  it("includes signed image URLs when provided", async () => {
    const card = await toCard(
      {
        id: "c1",
        deckId: "d1",
        frontText: null,
        frontImagePath: "deck/card/front/x.jpg",
        backText: null,
        backImagePath: "deck/card/back/x.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      },
      { front: "front-signed", back: "back-signed" },
    );
    expect(card.front.imageUrl).toBe("front-signed");
    expect(card.back.imageUrl).toBe("back-signed");
  });

  it("returns null imageUrl when path is present but signed url failed", async () => {
    const card = await toCard(
      {
        id: "c1",
        deckId: "d1",
        frontText: null,
        frontImagePath: "deck/card/front/x.jpg",
        backText: null,
        backImagePath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      },
      { front: null, back: null },
    );
    expect(card.front.imageUrl).toBeNull();
  });
});

function image(name: string) {
  return {
    name,
    type: "image/png",
    size: 1,
    bytes: new Blob(["x"], { type: "image/png" }),
  };
}

describe("createCard", () => {
  it("creates a card when the back side has only an image", async () => {
    let insertedBackImagePath: unknown = null;
    const now = new Date("2024-01-01T00:00:00.000Z");
    const db = {
      select: () => ({
        from: () => ({
          where: async () => [
            { id: "deck-1", userId: "user-1", archivedAt: null },
          ],
        }),
      }),
      insert: () => ({
        values: (values: Record<string, unknown>) => {
          insertedBackImagePath = values.backImagePath;
          return {
            returning: async () => [
              {
                id: values.id,
                deckId: values.deckId,
                frontText: values.frontText,
                frontImagePath: values.frontImagePath ?? null,
                backText: values.backText ?? null,
                backImagePath: values.backImagePath ?? null,
                createdAt: now,
                updatedAt: now,
                archivedAt: null,
              },
            ],
          };
        },
      }),
    } as never;

    const card = await createCard(
      db,
      createMockSupabase(),
      "user-1",
      "deck-1",
      {
        front: { text: "Prompt", image: null },
        back: {
          text: null,
          image: image("answer.png"),
        },
      },
    );

    expect(insertedBackImagePath).toMatch(/^deck-1\/.+\/back\/.+-answer\.png$/);
    expect(card?.back.imagePath).toBe(insertedBackImagePath);
  });

  it("removes uploaded images when a later create upload fails", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: async () => [
            { id: "deck-1", userId: "user-1", archivedAt: null },
          ],
        }),
      }),
    } as never;

    await expect(
      createCard(
        db,
        createMockSupabase({ failUploadName: "back.png" }),
        "user-1",
        "deck-1",
        {
          front: { text: null, image: image("front.png") },
          back: { text: null, image: image("back.png") },
        },
      ),
    ).rejects.toThrow("Upload failed");

    expect(supabaseState.removals).toEqual([
      { paths: [supabaseState.uploads[0].path] },
    ]);
  });

  it("removes uploaded images when card insert fails", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: async () => [
            { id: "deck-1", userId: "user-1", archivedAt: null },
          ],
        }),
      }),
      insert: () => ({
        values: () => ({
          returning: async () => {
            throw new Error("Insert failed");
          },
        }),
      }),
    } as never;

    await expect(
      createCard(db, createMockSupabase(), "user-1", "deck-1", {
        front: { text: null, image: image("front.png") },
        back: { text: null, image: image("back.png") },
      }),
    ).rejects.toThrow("Insert failed");

    expect(supabaseState.removals).toEqual([
      { paths: supabaseState.uploads.map((upload) => upload.path) },
    ]);
  });
});

describe("updateCard", () => {
  it("rejects updates that would leave a side empty before uploading", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: async () => [
            {
              id: "card-1",
              deckId: "deck-1",
              frontText: "Front",
              frontImagePath: null,
              backText: "Back",
              backImagePath: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              archivedAt: null,
            },
          ],
        }),
      }),
    } as never;

    await expect(
      updateCard(db, createMockSupabase(), "user-1", "deck-1", "card-1", {
        front: { text: null, image: null },
      }),
    ).rejects.toThrow("Front must include text or an image");

    expect(supabaseState.uploads).toEqual([]);
  });

  it("removes a newly uploaded replacement image when update fails", async () => {
    const existing = {
      id: "card-1",
      deckId: "deck-1",
      frontText: "Front",
      frontImagePath: "old/front.png",
      backText: "Back",
      backImagePath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
    };
    let selected = false;
    const db = {
      select: () => ({
        from: () => ({
          where: async () => {
            if (!selected) {
              selected = true;
              return [{ id: "deck-1", userId: "user-1", archivedAt: null }];
            }
            return [existing];
          },
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: async () => {
              throw new Error("Update failed");
            },
          }),
        }),
      }),
    } as never;

    await expect(
      updateCard(db, createMockSupabase(), "user-1", "deck-1", "card-1", {
        front: { image: image("new-front.png") },
      }),
    ).rejects.toThrow("Update failed");

    expect(supabaseState.removals).toContainEqual({
      paths: [supabaseState.uploads[0].path],
    });
    expect(supabaseState.removals).not.toContainEqual({
      paths: ["old/front.png"],
    });
  });
});

describe("deleteImage", () => {
  it("removes the path from storage", async () => {
    const supabase = createMockSupabase();
    await deleteImage(supabase, "deck/card/front/x.jpg");
    expect(supabaseState.removals).toEqual([
      { paths: ["deck/card/front/x.jpg"] },
    ]);
  });
});
