import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Plus, Heart, MessageCircle } from "lucide-react";
import { missedConnections, type MissedConnection } from "@/data/missed-connections";

const categoryColors: Record<MissedConnection["category"], string> = {
  romantic: "bg-accent/15 text-accent",
  friendly: "bg-primary/15 text-primary-foreground",
  funny: "bg-secondary text-secondary-foreground",
};

const categoryLabels: Record<MissedConnection["category"], string> = {
  romantic: "💛 Romantic",
  friendly: "🤝 Friendly",
  funny: "😂 Funny",
};

const MissedConnectionsPage = () => {
  const [filter, setFilter] = useState<MissedConnection["category"] | "all">("all");

  const filtered = filter === "all"
    ? missedConnections
    : missedConnections.filter((mc) => mc.category === filter);

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-4">
      {/* Filters */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["all", "romantic", "friendly", "funny"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              filter === cat
                ? "gradient-warm text-primary-foreground shadow-card"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {cat === "all" ? "✨ All" : categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Post button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 font-semibold text-primary-foreground transition-colors hover:bg-primary/10"
      >
        <Plus className="h-5 w-5" />
        <span>Post a Missed Connection</span>
      </motion.button>

      {/* Cards */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {filtered.map((mc, i) => (
            <motion.div
              key={mc.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-card p-5 shadow-card"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-display text-base font-bold text-foreground">
                  {mc.title}
                </h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${categoryColors[mc.category]}`}>
                  {categoryLabels[mc.category]}
                </span>
              </div>

              <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {mc.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {mc.time}
                </span>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-foreground/80">
                {mc.description}
              </p>

              <p className="mb-4 text-xs italic text-muted-foreground">
                "{mc.lookingFor}"
              </p>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{mc.postedAgo}</span>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary/10">
                    <Heart className="h-3.5 w-3.5" /> Relate
                  </button>
                  <button className="flex items-center gap-1 rounded-full gradient-warm px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-card">
                    <MessageCircle className="h-3.5 w-3.5" /> That's me!
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default MissedConnectionsPage;
