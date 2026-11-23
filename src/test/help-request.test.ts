import { describe, expect, it } from "vitest";
import { helpChatMessageSchema, helpChatStartSchema } from "@/lib/help-request";

describe("help chat messages", () => {
  it("requires a non-empty message", () => {
    expect(helpChatMessageSchema.safeParse("   ").success).toBe(false);
  });

  it("limits each chat message to 2,000 characters", () => {
    expect(helpChatMessageSchema.safeParse("x".repeat(2001)).success).toBe(false);
  });

  it("requires 10 characters for the first message but allows short follow-ups", () => {
    expect(helpChatStartSchema.safeParse("too short").success).toBe(false);
    expect(helpChatMessageSchema.safeParse("ok").success).toBe(true);
  });

  it("trims surrounding whitespace before sending", () => {
    expect(helpChatStartSchema.parse("  The profile card will not open.  ")).toBe(
      "The profile card will not open.",
    );
  });
});
