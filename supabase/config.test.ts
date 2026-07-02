import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Supabase auth email configuration", () => {
  it("uses a token-hash magic link template for cross-context sign-in", () => {
    const root = process.cwd();
    const config = readFileSync(join(root, "supabase", "config.toml"), "utf8");
    const template = readFileSync(
      join(root, "supabase", "templates", "magic-link.html"),
      "utf8",
    );

    expect(config).toContain("[auth.email.template.magic_link]");
    expect(config).toContain(
      'content_path = "./supabase/templates/magic-link.html"',
    );
    expect(template).toContain(
      "/auth/confirm?token_hash={{ .TokenHash }}&type=email",
    );
  });
});
