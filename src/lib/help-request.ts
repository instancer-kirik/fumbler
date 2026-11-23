import { z } from "zod";

export const HELP_REQUEST_CATEGORIES = [
  { value: "technical", label: "Something broke" },
  { value: "account", label: "Account or profile" },
  { value: "safety", label: "Safety or another user" },
  { value: "connection", label: "Connection or meetup" },
  { value: "other", label: "Something else" },
] as const;

export const helpChatMessageSchema = z
  .string()
  .trim()
  .min(1, "Write a message before sending.")
  .max(2000, "Keep each chat message under 2,000 characters.");

export const helpChatStartSchema = z
  .string()
  .trim()
  .min(10, "Give us at least 10 characters to start the conversation.")
  .max(2000, "Keep each chat message under 2,000 characters.");
