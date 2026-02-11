import { motion } from "framer-motion";
import type { ResonanceProfile } from "@/data/resonance-profile";
import { parseDistance, getSimulatedLastInteraction, getTier } from "@/utils/match-helpers";

interface MatchMapViewProps {
  profiles: ResonanceProfile[];
  onSelect: (profile: ResonanceProfile) => void;
}

const tierColors: Record<string, string> = {
  hot: "ring-red-400 shadow-red-400/30",
  warming: "ring-amber-400 shadow-amber-400/30",
  cold: "ring-blue-300 shadow-blue-300/20",
};

const MatchMapView = ({ profiles, onSelect }: MatchMapViewProps) => {
  // Position profiles in a radial layout based on distance
  // Center = you, rings = distance tiers
  const centerX = 50;
  const centerY = 50;

  const positioned = profiles.map((p, i) => {
    const dist = parseDistance(p.distance);
    const radius = Math.min(12 + dist * 7, 42); // % from center
    const angle = (i / profiles.length) * 2 * Math.PI - Math.PI / 2;
    // Add some jitter for natural feel
    const jitterX = (Math.sin(i * 137.5) * 4);
    const jitterY = (Math.cos(i * 137.5) * 4);
    const x = centerX + Math.cos(angle) * radius + jitterX;
    const y = centerY + Math.sin(angle) * radius + jitterY;
    const tier = getTier(getSimulatedLastInteraction(p.id));
    return { ...p, x, y, tier };
  });

  return (
    <div className="relative mx-4 mb-4 rounded-2xl bg-card border border-border overflow-hidden" style={{ height: 280 }}>
      {/* Concentric distance rings */}
      {[1, 2, 3].map((ring) => (
        <div
          key={ring}
          className="absolute rounded-full border border-border/30"
          style={{
            width: `${ring * 30}%`,
            height: `${ring * 30}%`,
            left: `${50 - ring * 15}%`,
            top: `${50 - ring * 15}%`,
          }}
        />
      ))}

      {/* Center — You */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          left: `${centerX}%`,
          top: `${centerY}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="h-8 w-8 rounded-full gradient-warm flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-elevated">
          You
        </div>
      </div>

      {/* Distance labels */}
      <span className="absolute text-[9px] text-muted-foreground/50 font-medium" style={{ left: "50%", top: "74%", transform: "translateX(-50%)" }}>
        5 mi
      </span>
      <span className="absolute text-[9px] text-muted-foreground/50 font-medium" style={{ left: "50%", top: "89%", transform: "translateX(-50%)" }}>
        10 mi
      </span>

      {/* Match nodes */}
      {positioned.map((p, i) => (
        <motion.button
          key={p.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
          onClick={() => onSelect(p)}
          className="absolute z-20 group"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className={`relative h-12 w-12 rounded-full overflow-hidden ring-2 shadow-lg ${tierColors[p.tier]} transition-all group-hover:scale-110`}>
            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
          </div>
          <p className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold text-foreground bg-card/80 px-1.5 rounded-full">
            {p.name}
          </p>
        </motion.button>
      ))}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex gap-2">
        {[
          { label: "Hot", color: "bg-red-400" },
          { label: "Warm", color: "bg-amber-400" },
          { label: "Cold", color: "bg-blue-300" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1 text-[8px] text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default MatchMapView;
