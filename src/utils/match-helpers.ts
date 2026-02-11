import type { ResonanceProfile } from "@/data/resonance-profile";

export interface MatchData {
  tags: string[];
  notes: string;
  lastInteraction?: number; // timestamp
  scheduledDate?: string;   // ISO string
}

export type MatchTier = "hot" | "warming" | "cold";

const DAY_MS = 86400000;

// Simulate last interaction — in production this would come from real data
export function getSimulatedLastInteraction(profileId: string): number {
  const stored = localStorage.getItem(`fumble-last-interaction-${profileId}`);
  if (stored) return parseInt(stored, 10);
  
  // Seed with deterministic mock data
  const seeds: Record<string, number> = {
    "1": Date.now() - DAY_MS * 0.5,  // half a day ago (hot)
    "2": Date.now() - DAY_MS * 4,    // 4 days ago (warming)
    "3": Date.now() - DAY_MS * 8,    // 8 days ago (cold)
    "4": Date.now() - DAY_MS * 1,    // 1 day ago (hot)
  };
  return seeds[profileId] || Date.now() - DAY_MS * 3;
}

export function touchInteraction(profileId: string) {
  localStorage.setItem(`fumble-last-interaction-${profileId}`, String(Date.now()));
}

export function getTier(lastInteraction: number): MatchTier {
  const daysSince = (Date.now() - lastInteraction) / DAY_MS;
  if (daysSince < 2) return "hot";
  if (daysSince < 5) return "warming";
  return "cold";
}

export function getFadeOpacity(lastInteraction: number): number {
  const daysSince = (Date.now() - lastInteraction) / DAY_MS;
  if (daysSince < 2) return 1;
  if (daysSince < 5) return 0.75;
  if (daysSince < 10) return 0.5;
  return 0.35;
}

export function getTimeSinceLabel(lastInteraction: number): string {
  const daysSince = Math.floor((Date.now() - lastInteraction) / DAY_MS);
  if (daysSince === 0) return "today";
  if (daysSince === 1) return "yesterday";
  return `${daysSince}d ago`;
}

export function tierLabel(tier: MatchTier): string {
  switch (tier) {
    case "hot": return "🔥 Hot";
    case "warming": return "☀️ Warming Up";
    case "cold": return "❄️ Going Cold";
  }
}

export function groupByTier(
  profiles: ResonanceProfile[]
): Record<MatchTier, (ResonanceProfile & { lastInteraction: number })[]> {
  const grouped: Record<MatchTier, (ResonanceProfile & { lastInteraction: number })[]> = {
    hot: [],
    warming: [],
    cold: [],
  };
  
  for (const p of profiles) {
    const lastInteraction = getSimulatedLastInteraction(p.id);
    const tier = getTier(lastInteraction);
    grouped[tier].push({ ...p, lastInteraction });
  }
  
  // Sort each tier by most recent first
  for (const tier of Object.keys(grouped) as MatchTier[]) {
    grouped[tier].sort((a, b) => b.lastInteraction - a.lastInteraction);
  }
  
  return grouped;
}

export function getNudges(
  profiles: ResonanceProfile[]
): { profile: ResonanceProfile; daysSince: number; message: string }[] {
  const nudges: { profile: ResonanceProfile; daysSince: number; message: string }[] = [];
  
  for (const p of profiles) {
    const lastInteraction = getSimulatedLastInteraction(p.id);
    const daysSince = Math.floor((Date.now() - lastInteraction) / DAY_MS);
    
    if (daysSince >= 3 && daysSince < 5) {
      nudges.push({
        profile: p,
        daysSince,
        message: `You matched with ${p.name} ${daysSince} days ago — don't let this one fade!`,
      });
    } else if (daysSince >= 5 && daysSince < 10) {
      nudges.push({
        profile: p,
        daysSince,
        message: `${p.name} is going cold... maybe schedule a fumble?`,
      });
    } else if (daysSince >= 10) {
      nudges.push({
        profile: p,
        daysSince,
        message: `Remember ${p.name}? It's been ${daysSince} days. Rediscover or let go?`,
      });
    }
  }
  
  return nudges.sort((a, b) => b.daysSince - a.daysSince);
}

export const defaultTags = ["Met IRL", "Great Convo", "Funny", "Vibes ✨", "Follow Up", "Coffee Date"];

// Parse distance string to approximate number for map
export function parseDistance(dist: string): number {
  const match = dist.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}
