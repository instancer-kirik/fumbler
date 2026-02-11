import { useState, useEffect, useRef } from "react";
import { Settings, Edit3, Shield, HelpCircle, Palette, Check, ChevronRight, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import profile1 from "@/assets/profile-1.jpg";

// Curated swatches grouped by mood — enough variety, not chaos
const colorGroups = [
  {
    label: "Warm",
    swatches: [
      { id: "honey",    hue: 45,  sat: 95, lit: 55, name: "Honey",    hex: "#E5A800" },
      { id: "amber",    hue: 35,  sat: 90, lit: 50, name: "Amber",    hex: "#E09420" },
      { id: "tangerine",hue: 25,  sat: 90, lit: 52, name: "Tangerine",hex: "#E87A1A" },
      { id: "ember",    hue: 15,  sat: 85, lit: 50, name: "Ember",    hex: "#E06030" },
      { id: "coral",    hue: 5,   sat: 80, lit: 58, name: "Coral",    hex: "#E86050" },
      { id: "peach",    hue: 20,  sat: 80, lit: 68, name: "Peach",    hex: "#F0A070" },
    ],
  },
  {
    label: "Cool",
    swatches: [
      { id: "ocean",    hue: 200, sat: 80, lit: 50, name: "Ocean",    hex: "#1A99E0" },
      { id: "sky",      hue: 195, sat: 70, lit: 58, name: "Sky",      hex: "#40B0D0" },
      { id: "teal",     hue: 175, sat: 65, lit: 42, name: "Teal",     hex: "#259990" },
      { id: "mint",     hue: 160, sat: 55, lit: 48, name: "Mint",     hex: "#38B088" },
      { id: "sage",     hue: 140, sat: 30, lit: 50, name: "Sage",     hex: "#5C9966" },
      { id: "forest",   hue: 150, sat: 45, lit: 38, name: "Forest",   hex: "#358C5C" },
    ],
  },
  {
    label: "Bold",
    swatches: [
      { id: "rose",     hue: 345, sat: 75, lit: 55, name: "Rosé",     hex: "#D94070" },
      { id: "magenta",  hue: 330, sat: 70, lit: 50, name: "Magenta",  hex: "#C03080" },
      { id: "plum",     hue: 300, sat: 45, lit: 45, name: "Plum",     hex: "#A34DA3" },
      { id: "lavender", hue: 270, sat: 55, lit: 58, name: "Lavender", hex: "#9066CC" },
      { id: "indigo",   hue: 240, sat: 50, lit: 52, name: "Indigo",   hex: "#5050C0" },
      { id: "midnight", hue: 225, sat: 55, lit: 45, name: "Midnight", hex: "#3B52A5" },
    ],
  },
];

const allSwatches = colorGroups.flatMap((g) => g.swatches);

type CustomSwatch = { id: string; hue: number; sat: number; lit: number; name: string; hex: string };

function loadCustomSwatches(): CustomSwatch[] {
  try {
    return JSON.parse(localStorage.getItem("fumble-custom-swatches") || "[]");
  } catch {
    return [];
  }
}

function saveCustomSwatches(swatches: CustomSwatch[]) {
  localStorage.setItem("fumble-custom-swatches", JSON.stringify(swatches));
}

function hexToHsl(hex: string): { hue: number; sat: number; lit: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { hue: Math.round(h * 360), sat: Math.round(s * 100), lit: Math.round(l * 100) };
}

function deriveAccentHue(hue: number) {
  // Complementary-adjacent accent
  return (hue + 30) % 360;
}

function applyCustomTheme(swatch: { hue: number; sat: number; lit: number }) {
  const { hue, sat, lit } = swatch;
  const root = document.documentElement;
  const primary = `${hue} ${sat}% ${lit}%`;
  const accentHue = deriveAccentHue(hue);
  const accent = `${accentHue} ${Math.max(sat - 15, 30)}% ${lit}%`;

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--ring", primary);

  // Background & foreground stay neutral but tinted
  root.style.setProperty("--background", `${hue} 20% 97%`);
  root.style.setProperty("--foreground", `${hue} 15% 12%`);
  root.style.setProperty("--card", `${hue} 18% 99%`);
  root.style.setProperty("--card-foreground", `${hue} 15% 12%`);
  root.style.setProperty("--popover", `${hue} 18% 99%`);
  root.style.setProperty("--popover-foreground", `${hue} 15% 12%`);
  root.style.setProperty("--primary-foreground", `${hue} 15% 12%`);
  root.style.setProperty("--secondary", `${hue} 30% 92%`);
  root.style.setProperty("--secondary-foreground", `${hue} 15% 12%`);
  root.style.setProperty("--muted", `${hue} 12% 94%`);
  root.style.setProperty("--muted-foreground", `${hue} 8% 48%`);
  root.style.setProperty("--border", `${hue} 12% 90%`);
  root.style.setProperty("--input", `${hue} 12% 90%`);

  root.style.setProperty(
    "--gradient-warm",
    `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))`
  );
  root.style.setProperty(
    "--gradient-hero",
    `linear-gradient(135deg, hsl(${primary}) 0%, hsl(${accent}) 100%)`
  );
  root.style.setProperty(
    "--shadow-card",
    `0 8px 32px -8px hsl(${hue} ${sat}% ${lit}% / 0.12), 0 2px 8px -2px hsl(0 0% 0% / 0.06)`
  );
}

const ProfilePage = () => {
  const [showPalette, setShowPalette] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customHex, setCustomHex] = useState("#");
  const [customName, setCustomName] = useState("");
  const [customSwatches, setCustomSwatches] = useState<CustomSwatch[]>(loadCustomSwatches);
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("fumble-theme") || "honey";
  });

  const allAvailable = [...allSwatches, ...customSwatches];

  useEffect(() => {
    const saved = localStorage.getItem("fumble-theme") || "honey";
    const swatch = allAvailable.find((s) => s.id === saved);
    if (swatch) applyCustomTheme(swatch);
  }, []);

  const handleSelect = (swatch: { id: string; hue: number; sat: number; lit: number }) => {
    setActiveTheme(swatch.id);
    applyCustomTheme(swatch);
    localStorage.setItem("fumble-theme", swatch.id);
  };

  const handleAddCustom = () => {
    const hex = customHex.startsWith("#") ? customHex : `#${customHex}`;
    const hsl = hexToHsl(hex);
    if (!hsl) return;
    const name = customName.trim() || `Custom`;
    const id = `custom-${Date.now()}`;
    const swatch: CustomSwatch = { id, ...hsl, name, hex };
    const updated = [...customSwatches, swatch];
    setCustomSwatches(updated);
    saveCustomSwatches(updated);
    handleSelect(swatch);
    setCustomHex("#");
    setCustomName("");
    setShowCustomInput(false);
  };

  const handleRemoveCustom = (id: string) => {
    const updated = customSwatches.filter((s) => s.id !== id);
    setCustomSwatches(updated);
    saveCustomSwatches(updated);
    if (activeTheme === id) {
      const honey = allSwatches[0];
      handleSelect(honey);
    }
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
            className={`rounded-full p-2.5 transition-all ${
              showPalette ? "gradient-warm scale-105" : "bg-secondary"
            }`}
          >
            <Palette
              className={`h-5 w-5 ${showPalette ? "text-primary-foreground" : "text-foreground"}`}
            />
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
            <div className="rounded-2xl bg-card p-4 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Theme
                </p>
                <span className="text-xs text-muted-foreground">
                  {allAvailable.find((s) => s.id === activeTheme)?.name || "Custom"}
                </span>
              </div>

              {colorGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                    {group.label}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {group.swatches.map((swatch) => {
                      const isActive = activeTheme === swatch.id;
                      return (
                        <button
                          key={swatch.id}
                          onClick={() => handleSelect(swatch)}
                          className="group relative flex flex-col items-center gap-1"
                          title={swatch.name}
                        >
                          <div
                            className={`h-9 w-9 rounded-full transition-all ${
                              isActive
                                ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110"
                                : "hover:scale-105"
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                          >
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex h-full w-full items-center justify-center"
                              >
                                <Check className="h-4 w-4 text-white drop-shadow-md" />
                              </motion.div>
                            )}
                          </div>
                          <span
                            className={`text-[9px] transition-colors ${
                              isActive
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {swatch.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Custom swatches */}
              {customSwatches.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                    Yours
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {customSwatches.map((swatch) => {
                      const isActive = activeTheme === swatch.id;
                      return (
                        <button
                          key={swatch.id}
                          onClick={() => handleSelect(swatch)}
                          onDoubleClick={() => handleRemoveCustom(swatch.id)}
                          className="group relative flex flex-col items-center gap-1"
                          title={`${swatch.name} — double-tap to remove`}
                        >
                          <div
                            className={`h-9 w-9 rounded-full transition-all ${
                              isActive
                                ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110"
                                : "hover:scale-105"
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                          >
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex h-full w-full items-center justify-center"
                              >
                                <Check className="h-4 w-4 text-white drop-shadow-md" />
                              </motion.div>
                            )}
                          </div>
                          <span
                            className={`text-[9px] transition-colors ${
                              isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                            }`}
                          >
                            {swatch.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add custom hex */}
              <div className="border-t border-border pt-3">
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add custom color
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
                        <div
                          className="h-5 w-5 rounded-full border border-border shrink-0"
                          style={{
                            backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : "#ccc",
                          }}
                        />
                        <input
                          type="text"
                          value={customHex}
                          onChange={(e) => {
                            let v = e.target.value;
                            if (!v.startsWith("#")) v = "#" + v;
                            setCustomHex(v.slice(0, 7));
                          }}
                          placeholder="#A855F7"
                          className="bg-transparent text-sm font-mono text-foreground outline-none w-20"
                          maxLength={7}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="Name it…"
                          className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                          maxLength={16}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCustom}
                        disabled={!/^#[0-9A-Fa-f]{6}$/.test(customHex)}
                        className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40 transition-opacity"
                      >
                        Save color
                      </button>
                      <button
                        onClick={() => { setShowCustomInput(false); setCustomHex("#"); setCustomName(""); }}
                        className="rounded-xl bg-secondary px-3 py-2"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </motion.div>
                )}
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
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
