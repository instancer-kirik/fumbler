import { describe, it, expect } from "vitest";
import { scoreQuiz, applyQuizToResonance } from "@/lib/personality-quiz";

const all = { frames: true, desires: true, archetypes: true, qualities: true };

describe("personality quiz", () => {
  it("picks the stronger side of each MBTI axis", () => {
    const r = scoreQuiz([{ s: { "mbti.E": 2 } }, { s: { "mbti.S": 2 } }, { s: { "mbti.T": 2 } }, { s: { "mbti.J": 2 } }]);
    expect(r.mbti).toBe("ESTJ");
  });

  it("picks the top attachment style and internet core", () => {
    const r = scoreQuiz([{ s: { "att.anxious": 2, "core.goblincore": 1 } }, { s: { "att.secure": 1, "core.goblincore": 2 } }]);
    expect(r.attachment).toBe("Anxious");
    expect(r.internetCore).toBe("Goblincore");
  });

  it("keeps existing profile entries and doesn't duplicate", () => {
    const r = scoreQuiz([{ a: { qualities: ["Direct", "Maker"] } }]);
    const out = applyQuizToResonance({ qualities: ["direct", "Funny"] }, r, all);
    expect(out.qualities).toEqual(["direct", "Funny", "Maker"]);
  });

  it("skips groups the user unchecked", () => {
    const r = scoreQuiz([{ s: { "mbti.I": 1 } }, { a: { qualities: ["Maker"] } }]);
    const out = applyQuizToResonance({}, r, { ...all, frames: false, qualities: false });
    expect(out.frames).toBeUndefined();
    expect(out.qualities).toBeUndefined();
  });
});
