import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ArtistIntroStep from "@/components/onboarding/ArtistIntroStep";

const Onboarding = () => {
  const { user, refreshOnboarding } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        age: parseInt(age, 10),
        bio: bio.trim() || null,
        onboarding_complete: true,
      })
      .eq("id", user.id);
    setLoading(false);

    if (error) {
      toast.error("Failed to save profile: " + error.message);
      return;
    }
    await refreshOnboarding();
    setStep(2);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center bg-background px-6 py-8">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {step === 2 ? (
          <ArtistIntroStep defaultName={name.trim()} onBack={() => setStep(1)} />
        ) : (
          <>
            <div className="mb-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Step 1 of 2 · The basics</p>
              <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Let's set you up</h1>
              <p className="text-sm text-muted-foreground">The basics — you can add photos and more later.</p>
            </div>

            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <label htmlFor="onboarding-name" className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
                <input
                  id="onboarding-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="What should people call you?"
                  required
                  maxLength={100}
                  className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm text-foreground outline-none ring-1 ring-border transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="onboarding-age" className="mb-1 block text-xs font-medium text-muted-foreground">Age</label>
                <input
                  id="onboarding-age"
                  type="number"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="18+"
                  required
                  min={18}
                  max={120}
                  className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm text-foreground outline-none ring-1 ring-border transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="onboarding-bio" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Bio <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <textarea
                  id="onboarding-bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="A little about you…"
                  maxLength={300}
                  rows={3}
                  className="w-full resize-none rounded-2xl bg-card px-4 py-3.5 text-sm text-foreground outline-none ring-1 ring-border transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim() || !age}
                className="mt-4 w-full rounded-2xl gradient-warm py-3.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
              >
                {loading ? "Saving…" : "Continue"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Onboarding;
