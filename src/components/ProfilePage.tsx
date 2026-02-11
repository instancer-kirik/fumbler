import { useState, useEffect } from "react";
import { Settings, Edit3, Shield, HelpCircle, Palette, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import profile1 from "@/assets/profile-1.jpg";

const themes = [
  {
    id: "honey",
    name: "Honey",
    colors: ["45 95% 55%", "30 80% 55%", "45 30% 97%", "30 20% 12%"],
    preview: ["#E5A800", "#CC7A29", "#F7F3ED", "#231E17"],
  },
  {
    id: "rose",
    name: "Rosé",
    colors: ["350 80% 60%", "330 70% 50%", "350 30% 97%", "350 20% 12%"],
    preview: ["#E0527A", "#B33D8A", "#F7EDF0", "#2B1720"],
  },
  {
    id: "lavender",
    name: "Lavender",
    colors: ["270 60% 60%", "290 50% 50%", "270 30% 97%", "270 20% 12%"],
    preview: ["#9966CC", "#9933B3", "#F1EDF7", "#1F172B"],
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: ["200 80% 50%", "220 70% 45%", "200 30% 97%", "210 20% 12%"],
    preview: ["#1A99E0", "#2656A3", "#EDF3F7", "#17202B"],
  },
  {
    id: "mint",
    name: "Mint",
    colors: ["160 60% 45%", "140 50% 40%", "160 30% 97%", "160 20% 12%"],
    preview: ["#2EB88A", "#339966", "#EDF7F3", "#172B22"],
  },
  {
    id: "ember",
    name: "Ember",
    colors: ["15 90% 55%", "0 75% 50%", "20 30% 97%", "15 20% 12%"],
    preview: ["#E8651A", "#C03030", "#F7F0ED", "#2B1D17"],
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: ["240 50% 55%", "260 40% 45%", "240 20% 97%", "240 20% 10%"],
    preview: ["#5555CC", "#6D47A3", "#F0F0F7", "#18182B"],
  },
  {
    id: "sage",
    name: "Sage",
    colors: ["130 30% 50%", "90 25% 45%", "120 20% 97%", "120 20% 12%"],
    preview: ["#5C9966", "#6B8C59", "#F0F5F0", "#1A2B1A"],
  },
];

function applyTheme(themeId: string) {
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return;

  const [primary, accent, background, foreground] = theme.colors;
  const root = document.documentElement;

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--background", background);
  root.style.setProperty("--foreground", foreground);
  root.style.setProperty("--card-foreground", foreground);
  root.style.setProperty("--popover-foreground", foreground);
  root.style.setProperty("--primary-foreground", foreground);
  root.style.setProperty("--secondary-foreground", foreground);

  // Derive secondary/muted from primary hue
  const hue = primary.split(" ")[0];
  root.style.setProperty("--secondary", `${hue} 40% 92%`);
  root.style.setProperty("--muted", `${hue} 15% 94%`);
  root.style.setProperty("--muted-foreground", `${hue} 10% 50%`);
  root.style.setProperty("--border", `${hue} 15% 90%`);
  root.style.setProperty("--input", `${hue} 15% 90%`);
  root.style.setProperty("--card", `${hue} 25% 99%`);
  root.style.setProperty("--popover", `${hue} 25% 99%`);

  // Update gradients
  root.style.setProperty(
    "--gradient-warm",
    `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))`
  );
  root.style.setProperty(
    "--gradient-hero",
    `linear-gradient(135deg, hsl(${primary}) 0%, hsl(${accent}) 100%)`
  );

  localStorage.setItem("fumble-theme", themeId);
}

const ProfilePage = () => {
  const [showPalette, setShowPalette] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("fumble-theme") || "honey";
  });

  useEffect(() => {
    applyTheme(activeTheme);
  }, []);

  const handleThemeSelect = (themeId: string) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Profile
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className={`rounded-full p-2.5 transition-colors ${
              showPalette ? "gradient-warm" : "bg-secondary"
            }`}
          >
            <Palette className={`h-5 w-5 ${showPalette ? "text-primary-foreground" : "text-foreground"}`} />
          </button>
          <button className="rounded-full bg-secondary p-2.5">
            <Settings className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="rounded-2xl bg-card p-4 shadow-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Choose your vibe
              </p>
              <div className="grid grid-cols-4 gap-3">
                {themes.map((theme) => {
                  const isActive = activeTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                        isActive
                          ? "bg-secondary ring-2 ring-primary"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1]})`,
                          }}
                        />
                        {isActive && (
                          <Check className="relative z-10 h-4 w-4 text-white drop-shadow-md" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-foreground">
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-4">
          <div className="h-28 w-28 overflow-hidden rounded-full gradient-warm p-[3px]">
            <img
              src={profile1}
              alt="Your profile"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <button className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-card">
            <Edit3 className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>

        <h2 className="font-display text-xl font-bold text-foreground">
          You, 24
        </h2>
        <p className="text-sm text-muted-foreground">@your_fumble</p>
      </motion.div>

      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Likes", value: "42" },
          { label: "Matches", value: "12" },
          { label: "Fumbles", value: "∞" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-card p-4 shadow-card">
            <p className="font-display text-xl font-bold text-primary">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {[
          { icon: Edit3, label: "Edit Profile" },
          { icon: Shield, label: "Safety & Privacy" },
          { icon: HelpCircle, label: "Help & Support" },
        ].map((item) => (
          <button
            key={item.label}
            className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card transition-colors hover:bg-secondary"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
