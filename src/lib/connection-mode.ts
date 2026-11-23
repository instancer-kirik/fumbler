import type { ExtraFilters } from "@/lib/discover-filters";

export type ConnectionMode = "all" | "platonic";

export const CONNECTION_MODE_KEY = "fumbler.discover.connectionMode";

export const loadConnectionMode = (): ConnectionMode => {
  if (typeof window === "undefined") return "all";
  return localStorage.getItem(CONNECTION_MODE_KEY) === "platonic" ? "platonic" : "all";
};

export const saveConnectionMode = (mode: ConnectionMode) => {
  if (typeof window !== "undefined") localStorage.setItem(CONNECTION_MODE_KEY, mode);
};

/** All keeps the existing open discovery pool; Platonic requires an explicit friendship signal. */
export const getCandidateIntentFilter = (mode: ConnectionMode): string | null =>
  mode === "platonic" ? "looking_for.ov.{Platonic},profile_types.ov.{Friends}" : null;

/** Hidden dating controls must never leak into a platonic query through saved filters. */
export const filtersForMode = (filters: ExtraFilters, mode: ConnectionMode): ExtraFilters =>
  mode === "platonic"
    ? { ...filters, orientations: [], profileTypes: [] }
    : filters;

export const getPlatonicBadge = (profile: {
  lookingFor?: string[] | null;
  profileTypes?: string[] | null;
}): string | null => {
  const lookingFor = profile.lookingFor || [];
  const profileTypes = profile.profileTypes || [];
  if (!lookingFor.includes("Platonic") && !profileTypes.includes("Friends")) return null;
  const alsoRomantic = ["Romantic", "Casual", "Serious", "Play"].some((intent) =>
    lookingFor.includes(intent),
  );
  return alsoRomantic ? "Open to platonic" : "Platonic";
};
