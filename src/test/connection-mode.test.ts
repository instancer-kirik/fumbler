import { describe, expect, it } from "vitest";
import { DEFAULT_EXTRA_FILTERS } from "@/lib/discover-filters";
import { filtersForMode, getCandidateIntentFilter, getPlatonicBadge } from "@/lib/connection-mode";

describe("platonic discovery", () => {
  it("does not remove platonic seekers from the All discovery pool", () => {
    expect(getCandidateIntentFilter("all")).toBeNull();
  });

  it("uses the existing Platonic or Friends fields in the dedicated mode", () => {
    expect(getCandidateIntentFilter("platonic")).toBe("looking_for.ov.{Platonic},profile_types.ov.{Friends}");
  });

  it("ignores saved orientation and profile-type filters in Platonic mode", () => {
    const filtered = filtersForMode({
      ...DEFAULT_EXTRA_FILTERS,
      orientations: ["Queer"],
      profileTypes: ["Dating", "Play"],
      hasPhoto: true,
    }, "platonic");
    expect(filtered.orientations).toEqual([]);
    expect(filtered.profileTypes).toEqual([]);
    expect(filtered.hasPhoto).toBe(true);
  });

  it("preserves every filter in All mode", () => {
    const filters = { ...DEFAULT_EXTRA_FILTERS, orientations: ["Queer"], profileTypes: ["Dating"] };
    expect(filtersForMode(filters, "all")).toEqual(filters);
  });

  it("flags platonic-only and mixed-intent profiles accurately", () => {
    expect(getPlatonicBadge({ lookingFor: ["Platonic"], profileTypes: [] })).toBe("Platonic");
    expect(getPlatonicBadge({ lookingFor: ["Platonic", "Romantic"], profileTypes: [] })).toBe("Open to platonic");
    expect(getPlatonicBadge({ lookingFor: [], profileTypes: ["Friends"] })).toBe("Platonic");
    expect(getPlatonicBadge({ lookingFor: ["Romantic"], profileTypes: ["Dating"] })).toBeNull();
  });
});
