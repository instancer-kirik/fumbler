export const EXTRA_FILTERS_KEY = "fumbler.discover.extraFilters";

export interface ExtraFilters {
  orientations: string[];
  profileTypes: string[];
  hasPhoto: boolean;
  hasResonance: boolean;
  publicOnly: boolean;
}

export const DEFAULT_EXTRA_FILTERS: ExtraFilters = {
  orientations: [],
  profileTypes: [],
  hasPhoto: false,
  hasResonance: false,
  publicOnly: false,
};

export const ORIENTATIONS = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Queer",
  "Asexual",
  "Demisexual",
  "Questioning",
];

export const PROFILE_TYPES = [
  "Dating",
  "Friends",
  "Collab",
  "Band",
  "Creative",
  "Networking",
  "Play",
];

export const loadExtraFilters = (): ExtraFilters => {
  if (typeof window === "undefined") return DEFAULT_EXTRA_FILTERS;
  try {
    const raw = localStorage.getItem(EXTRA_FILTERS_KEY);
    if (!raw) return DEFAULT_EXTRA_FILTERS;
    return { ...DEFAULT_EXTRA_FILTERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_EXTRA_FILTERS;
  }
};

export const saveExtraFilters = (f: ExtraFilters) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXTRA_FILTERS_KEY, JSON.stringify(f));
};

export const countActiveExtras = (f: ExtraFilters) =>
  f.orientations.length +
  f.profileTypes.length +
  (f.hasPhoto ? 1 : 0) +
  (f.hasResonance ? 1 : 0) +
  (f.publicOnly ? 1 : 0);
