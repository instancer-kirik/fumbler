import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, MessageCircle, Handshake, Zap } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-warm shadow-lg">
            <Heart className="h-10 w-10 text-primary-foreground" fill="currentColor" />
          </div>

          <h1 className="font-display text-5xl font-bold text-foreground mb-3">
            fumble
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto">
            No guessing games. No unspoken debts.
            <br />
            <span className="text-foreground font-medium">Just clarity, consent & a little chaos.</span>
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 flex flex-col gap-3 w-full max-w-xs"
        >
          {[
            { icon: Sparkles, text: "Resonance matching, not algorithms" },
            { icon: Handshake, text: "Mutual agreements, not assumptions" },
            { icon: MessageCircle, text: "Missed connections, found" },
            { icon: Zap, text: "Playful stakes, real accountability" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-xs text-muted-foreground max-w-[260px] leading-relaxed"
        >
          Social contracts, but editable. Set expectations together — before the awkward part.
        </motion.p>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="px-6 pb-10 space-y-3"
      >
        <button
          onClick={() => navigate("/auth")}
          className="w-full rounded-2xl gradient-warm py-4 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
        >
          Start fumbling
        </button>
        <button
          onClick={() => navigate("/auth")}
          className="w-full rounded-2xl bg-card py-4 text-sm font-semibold text-foreground shadow-card transition-colors hover:bg-secondary"
        >
          I already have an account
        </button>
      </motion.div>
    </div>
  );
};

export default Landing;
