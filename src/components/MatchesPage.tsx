import { profiles } from "@/data/profiles";
import { motion } from "framer-motion";

const MatchesPage = () => {
  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">
        Matches
      </h1>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          New Matches
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {profiles.slice(0, 3).map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex-shrink-0"
            >
              <div className="relative h-24 w-20 overflow-hidden rounded-2xl gradient-warm p-[2px]">
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              </div>
              <p className="mt-1.5 text-center text-xs font-semibold text-foreground">
                {profile.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Messages
      </h2>
      <div className="space-y-3">
        {profiles.map((profile, i) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card"
          >
            <img
              src={profile.image}
              alt={profile.name}
              className="h-14 w-14 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-display font-semibold text-foreground">
                {profile.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Sent you a message 💬
              </p>
            </div>
            <div className="h-2.5 w-2.5 rounded-full gradient-warm" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MatchesPage;
