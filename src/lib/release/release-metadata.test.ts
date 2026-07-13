import { afterEach, describe, expect, it } from "vitest";

import { getReleaseId, hasReleaseMetadata } from "./release-metadata";

const ENV_KEY = "NEXT_PUBLIC_APP_RELEASE_ID";

afterEach(() => {
  delete process.env[ENV_KEY];
});

describe("release metadata", () => {
  it("reports availability when production metadata is present", () => {
    process.env[ENV_KEY] = "release-abc-123";

    expect(hasReleaseMetadata()).toBe(true);
    expect(getReleaseId()).toBe("release-abc-123");
  });

  it("reports no availability when production metadata is missing", () => {
    delete process.env[ENV_KEY];

    expect(hasReleaseMetadata()).toBe(false);
    expect(getReleaseId()).toBeNull();
  });

  it("treats a blank env value as missing", () => {
    process.env[ENV_KEY] = "   ";

    expect(hasReleaseMetadata()).toBe(false);
    expect(getReleaseId()).toBeNull();
  });

  it("returns the same value across repeated reads", () => {
    process.env[ENV_KEY] = "stable-id";

    expect(getReleaseId()).toBe("stable-id");
    expect(getReleaseId()).toBe("stable-id");
  });
});
