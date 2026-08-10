import { describe, expect, it } from "vitest";

describe("GitHub Action helpers", () => {
  it("parses boolean inputs", async () => {
    const action = await import("../../../scripts/github-action.mjs");

    expect(action.parseBooleanInput("true", "doctor")).toBe(true);
    expect(action.parseBooleanInput("0", "doctor")).toBe(false);
    expect(() => action.parseBooleanInput("maybe", "doctor")).toThrow(/doctor/);
  });

  it("parses minimum score", async () => {
    const action = await import("../../../scripts/github-action.mjs");

    expect(action.parseMinimumScore("80")).toBe(80);
    expect(() => action.parseMinimumScore("101")).toThrow(/minimum-score/);
  });

  it("formats GitHub annotations for validation issues", async () => {
    const action = await import("../../../scripts/github-action.mjs");

    expect(
      action.annotationForIssue({
        path: "permissions.filesystem",
        code: "invalid_value",
        message: "Expected: none | read | workspace",
      }),
    ).toBe(
      "::error file=ai.json,line=1,title=invalid_value::permissions.filesystem%3A Expected%3A none | read | workspace",
    );
  });
});
