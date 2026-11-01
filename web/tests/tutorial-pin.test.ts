import { afterEach, describe, expect, it, vi } from "vitest";
import { isTutorialPin, tutorialToken } from "@/lib/tutorial-pin";

afterEach(() => vi.unstubAllEnvs());

describe("PIN tutorial", () => {
  it("menerima PIN bawaan dan menolak yang lain", () => {
    vi.stubEnv("TUTORIAL_PIN", "");
    expect(isTutorialPin("0001")).toBe(true);
    expect(isTutorialPin(" 0001 ")).toBe(true);
    expect(isTutorialPin("1")).toBe(false);
    expect(isTutorialPin("")).toBe(false);
  });

  it("cookie tidak berisi PIN dan batal kalau PIN diganti", () => {
    vi.stubEnv("TUTORIAL_PIN", "0001");
    vi.stubEnv("AUTH_SECRET", "rahasia");
    const lama = tutorialToken();
    expect(lama).not.toContain("0001");
    vi.stubEnv("TUTORIAL_PIN", "0002");
    expect(tutorialToken()).not.toBe(lama);
  });
});
