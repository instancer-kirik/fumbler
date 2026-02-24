import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Coffee, DollarSign, Github } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-12 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-card hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">
          Back
        </span>
      </div>

      <div className="flex-1 px-6 pb-12 space-y-8">
        {/* App identity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center pt-4 pb-2"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-warm shadow-lg">
            <Heart
              className="h-8 w-8 text-primary-foreground"
              fill="currentColor"
            />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            fumbler
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-[260px] leading-relaxed">
            A compendium of what works on you/me. Selective visibility,
            tag-based discovery, and honest context.
          </p>
        </motion.div>

        {/* The story */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-2xl bg-card shadow-card p-5 space-y-3"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            Built by me :3
          </p>
        </motion.div>

        {/* Support section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-3"
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Support the developer
          </h2>

          {/* Ko-fi */}
          <a
            href="https://ko-fi.com/instance_select"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-card shadow-card p-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF5E5B]/10 group-hover:bg-[#FF5E5B]/20 transition-colors">
              <Coffee className="h-5 w-5 text-[#FF5E5B]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Buy me a coffee
              </p>
              <p className="text-xs text-muted-foreground">
                Ko-fi — one-time or recurring
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              ko-fi.com ↗
            </span>
          </a>

          {/* Cash App */}
          <a
            href="https://cash.app/$Instancer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-card shadow-card p-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00D54B]/10 group-hover:bg-[#00D54B]/20 transition-colors">
              <DollarSign className="h-5 w-5 text-[#00D54B]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Cash App</p>
              <p className="text-xs text-muted-foreground font-mono">
                $Instancer
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              cash.app ↗
            </span>
          </a>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-center text-xs text-muted-foreground leading-relaxed px-4"
        >
          fumbler is free to use. Support is genuinely appreciated and goes
          directly into keeping the lights on and building more weird features.
        </motion.p>
      </div>
    </div>
  );
};

export default About;
