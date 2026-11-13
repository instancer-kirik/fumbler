import { describe, it, expect } from "vitest";
import { scoreQuiz, applyQuizToResonance } from "@/lib/personality-quiz";

const all = { frames: true, desires: true, archetypes: true, qualities: true, projects: true };

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
    const r = scoreQuiz([{ s: { "mbti.I": 1 } }, { a: { qualities: ["Maker"], skills: [{ name: "Sound" }] } }]);
    const out = applyQuizToResonance({}, r, { ...all, frames: false, qualities: false, projects: false });
    expect(out.frames).toBeUndefined();
    expect(out.qualities).toBeUndefined();
    expect(out.skills).toBeUndefined();
  });

  it("describes creative and project pulls without treating them as MBTI", () => {
    const r = scoreQuiz([
      { s: { "creative.worldbuilder": 2, "creative.maker": 1, "project.duo": 2, "project.crew": 1 } },
    ]);
    expect(r.creativeMode).toBe("Worldbuilder");
    expect(r.projectStyle).toBe("Creative duo");
    expect(r.mbti).toBe("INFP");
  });

  it("adds self-selected creative details without overwriting existing ones", () => {
    const r = scoreQuiz([
      {
        a: {
          skills: [{ name: "Sound design", level: "working", intent: "practice" }],
          collaborations: [{ kind: "Band", role: "Sound designer", lookingFor: "A vocalist" }],
          "offering.roles": ["Bandmate"],
          aspirations: ["Record an album"],
        },
      },
    ]);
    const out = applyQuizToResonance(
      {
        skills: [{ name: "sound design", level: "deep", intent: "teach", note: "Ten years" }],
        collaborations: [{ kind: "band", role: "sound designer", lookingFor: "A drummer", notes: "Keep me" }],
        offering: { roles: ["Producer"], notes: "Leave this intact" },
        aspirations: ["Play a festival"],
      },
      r,
      all,
    );
    expect(out.skills).toHaveLength(1);
    expect(out.skills[0].level).toBe("deep");
    expect(out.collaborations).toHaveLength(1);
    expect(out.collaborations[0].lookingFor).toBe("A drummer");
    expect(out.offering.roles).toEqual(["Producer", "Bandmate"]);
    expect(out.offering.notes).toBe("Leave this intact");
    expect(out.aspirations).toEqual(["Play a festival", "Record an album"]);
  });
});
