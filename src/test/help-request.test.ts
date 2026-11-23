import { describe, expect, it } from "vitest";
import { helpChatMessageSchema, helpRequestSchema } from "@/lib/help-request";

const validRequest = {
  category: "technical",
  message: "The profile card will not open.",
  pagePath: "/discover",
  allowContact: true,
} as const;

describe("help request validation", () => {
  it("accepts a complete private help request", () => {
    expect(helpRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("requires at least 10 non-whitespace characters", () => {
    expect(
      helpRequestSchema.safeParse({ ...validRequest, message: "  too tiny  " }).success,
    ).toBe(false);
  });

  it("limits messages to 2,000 characters", () => {
    expect(
      helpRequestSchema.safeParse({ ...validRequest, message: "x".repeat(2001) }).success,
    ).toBe(false);
  });

  it("rejects categories outside the help-team routing list", () => {
    expect(
      helpRequestSchema.safeParse({ ...validRequest, category: "everything" }).success,
    ).toBe(false);
  });
});

describe("help chat messages", () => {
  it("requires a non-empty message", () => {
    expect(helpChatMessageSchema.safeParse("   ").success).toBe(false);
  });

  it("limits each chat message to 2,000 characters", () => {
    expect(helpChatMessageSchema.safeParse("x".repeat(2001)).success).toBe(false);
  });
});
