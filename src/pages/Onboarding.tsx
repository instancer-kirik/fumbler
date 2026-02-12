import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        age: parseInt(age),
        bio: bio || null,
        onboarding_complete: true,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.error("Failed to save profile: " + error.message);
    } else {
      navigate("/app");
    }
  };

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background flex flex-col justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Let's set you up
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          The basics — you can add photos later.
        </p>

        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should people call you?"
              required
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="18+"
              required
              min={18}
              max={120}
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Bio <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A little about you..."
              maxLength={300}
              rows={3}
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name || !age}
            className="w-full rounded-2xl gradient-warm py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity mt-4"
          >
            {loading ? "Saving..." : "Let's fumble"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
