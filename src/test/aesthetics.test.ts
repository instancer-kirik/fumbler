import { describe, expect, it } from "vitest";
import { AESTHETIC_CATEGORIES, CURATED_AESTHETICS, curatedAestheticBySlug, filterAesthetics, slugifyAesthetic } from "@/data/aesthetics";

 describe("aesthetic atlas", () => {
  it("starts with 48 styles across four equally sized branches", () => {
    expect(CURATED_AESTHETICS).toHaveLength(48);
    for (const category of AESTHETIC_CATEGORIES) {
      expect(CURATED_AESTHETICS.filter((entry) => entry.category === category.id)).toHaveLength(12);
    }
  });

  it("uses unique slugs and valid cross-links", () => {
    expect(new Set(CURATED_AESTHETICS.map((entry) => entry.slug)).size).toBe(CURATED_AESTHETICS.length);
    for (const entry of CURATED_AESTHETICS) {
      for (const related of entry.related) expect(curatedAestheticBySlug.has(related), `${entry.slug} -> ${related}`).toBe(true);
    }
  });

  it("searches tags and filters branches without requiring images", () => {
    const results = filterAesthetics(CURATED_AESTHETICS, "moss", "fashion");
    expect(results.map((entry) => entry.slug)).toContain("goblincore");
    expect(results.every((entry) => entry.category === "fashion")).toBe(true);
  });

  it("makes readable community slugs", () => {
    expect(slugifyAesthetic("  Cozy Rocket Workshop! ")).toBe("cozy-rocket-workshop");
  });
});
