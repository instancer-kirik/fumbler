import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, MessageCircle, Handshake, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Info } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/discover", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background flex flex-col">
      {/* About link */}
      <div className="flex justify-end px-5 pt-5">
        <button
          onClick={() => navigate("/about")}
          className="flex items-center gap-1.5 rounded-xl bg-card/80 backdrop-blur px-3 py-1.5 shadow-card hover:bg-card transition-colors"
        >
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            About
          </span>
        </button>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-warm shadow-lg">
            <Heart
              className="h-10 w-10 text-primary-foreground"
              fill="currentColor"
            />
          </div>

          <h1 className="font-display text-5xl font-bold text-foreground mb-3">
            fumbler
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto">
            Figure out what works on you.
            <br />
            <span className="text-foreground font-medium">
              Share your context.
            </span>
          </p>
        </motion.div>

        {/* What this actually is */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 flex flex-col gap-3 w-full max-w-xs"
        >
          {[
            {
              icon: Sparkles,
              text: "This started with me trying to create a compendium of 'what works on me'",
            },
            {
              icon: Handshake,
              text: "Better ways to set expectations and boundaries.",
            },
            { icon: MessageCircle, text: "Missed Connections thingy" },
            {
              icon: Zap,
              text: "Consensual variety invoicing because asking and dynamics. Default is disabled.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {item.text}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Origin note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-xs text-muted-foreground max-w-[260px] leading-relaxed"
        >
          Selective visibility and tag based discovery.
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
          Welcome
        </button>
        <button
          onClick={() => navigate("/u/baon")}
          className="w-full rounded-2xl border-2 border-primary/30 bg-primary/5 py-3.5 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
        >
          👀 peek at an example profile
        </button>
      </motion.div>
    </div>
  );
};

export default Landing;
