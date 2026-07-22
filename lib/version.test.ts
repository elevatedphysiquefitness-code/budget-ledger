import { describe, expect, it } from "vitest";
import { isNewerVersion } from "./version";

describe("isNewerVersion", () => {
  it("detects a newer patch version", () => {
    expect(isNewerVersion("0.1.0", "0.1.1")).toBe(true);
  });

  it("detects a newer minor version", () => {
    expect(isNewerVersion("0.1.9", "0.2.0")).toBe(true);
  });

  it("detects a newer major version", () => {
    expect(isNewerVersion("1.9.9", "2.0.0")).toBe(true);
  });

  it("returns false when versions are equal", () => {
    expect(isNewerVersion("0.1.0", "0.1.0")).toBe(false);
  });

  it("returns false when latest is actually older", () => {
    expect(isNewerVersion("1.0.0", "0.9.0")).toBe(false);
  });

  it("handles a leading 'v' prefix on either side", () => {
    expect(isNewerVersion("0.1.0", "v0.2.0")).toBe(true);
    expect(isNewerVersion("v0.1.0", "0.2.0")).toBe(true);
  });

  it("pads missing version parts with 0", () => {
    expect(isNewerVersion("0.1", "0.1.1")).toBe(true);
    expect(isNewerVersion("0.1.0", "0.1")).toBe(false);
  });
});
