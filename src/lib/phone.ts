// Turns a typed phone number into something a phone dialer can actually use.

/** Strip spaces, dashes, dots and parentheses; keep a leading "+" for country codes. */
export function normalizePhone(value: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

/** A number is dialable when it has 7–15 digits (E.164 range). */
export function isCallablePhone(value: string | null | undefined): boolean {
  const normalized = normalizePhone(value || "");
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** The dialer link, or null when there is nothing sensible to dial. */
export function telHref(value: string | null | undefined): string | null {
  if (!isCallablePhone(value)) return null;
  return `tel:${normalizePhone(value || "")}`;
}
