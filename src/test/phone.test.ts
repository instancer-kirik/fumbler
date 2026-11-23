import { describe, expect, it } from "vitest";
import { isCallablePhone, normalizePhone, telHref } from "@/lib/phone";

describe("phone numbers for calling people", () => {
  it("strips spaces, dashes and parentheses", () => {
    expect(normalizePhone("(415) 555-0134")).toBe("4155550134");
  });

  it("keeps a leading plus for country codes", () => {
    expect(normalizePhone("+1 (415) 555-0134")).toBe("+14155550134");
  });

  it("returns an empty string when nothing dialable was typed", () => {
    expect(normalizePhone("   ")).toBe("");
    expect(normalizePhone("call me maybe")).toBe("");
  });

  it("builds a dialer link from a typed number", () => {
    expect(telHref("415-555-0134")).toBe("tel:4155550134");
    expect(telHref("+44 20 7946 0958")).toBe("tel:+442079460958");
  });

  it("offers no dialer link for missing or too-short numbers", () => {
    expect(telHref(null)).toBeNull();
    expect(telHref("")).toBeNull();
    expect(telHref("12345")).toBeNull();
    expect(isCallablePhone("12345")).toBe(false);
  });

  it("offers no dialer link for absurdly long numbers", () => {
    expect(telHref("+1441111111111111111")).toBeNull();
  });
});
