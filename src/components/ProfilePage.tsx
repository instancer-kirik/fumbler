import { useState, useEffect } from "react";
import { Settings, Edit3, Shield, HelpCircle, Palette, Check, ChevronRight, Plus, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ThemePalette from "@/components/profile/ThemePalette";
import EditProfileSheet from "@/components/profile/EditProfileSheet";
import ResonanceEditor from "@/components/profile/ResonanceEditor";

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showPalette, setShowPalette] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showResonance, setShowResonance] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;
    const [profileRes, photosRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, username, avatar_url, bio, age").eq("id", user.id).single(),
      supabase.from("fumble_photos").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    setPhotoCount(photosRes.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className={`rounded-full p-2.5 transition-all ${showPalette ? "gradient-warm scale-105" : "bg-secondary"}`}
          >
            <Palette className={`h-5 w-5 ${showPalette ? "text-primary-foreground" : "text-foreground"}`} />
          </button>
          <button onClick={handleSignOut} className="rounded-full bg-secondary p-2.5">
            <LogOut className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPalette && <ThemePalette />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-4">
          <div className="h-28 w-28 overflow-hidden rounded-full gradient-warm p-[3px]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Your profile" className="h-full w-full rounded-full object-cover" />
            ) : (
              <div className="h-full w-full rounded-full bg-muted flex items-center justify-center text-3xl font-display text-muted-foreground">
                {profile?.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-card"
          >
            <Edit3 className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>

        <h2 className="font-display text-xl font-bold text-foreground">
          {profile?.full_name || "Anonymous"}{profile?.age ? `, ${profile.age}` : ""}
        </h2>
        <p className="text-sm text-muted-foreground">@{profile?.username || "unknown"}</p>
      </motion.div>

      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Photos", value: String(photoCount) },
          { label: "Matches", value: "—" },
          { label: "Fumbles", value: "∞" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-card p-4 shadow-card">
            <p className="font-display text-xl font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {[
          { icon: Edit3, label: "Edit Profile", action: () => setShowEdit(true) },
          { icon: Settings, label: "Resonance Profile", action: () => setShowResonance(true) },
          { icon: Shield, label: "Safety & Privacy" },
          { icon: HelpCircle, label: "Help & Support" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card transition-colors hover:bg-secondary"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{item.label}</span>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <EditProfileSheet
        open={showEdit}
        onOpenChange={setShowEdit}
        profile={profile}
        onSaved={fetchProfile}
      />

      <ResonanceEditor
        open={showResonance}
        onOpenChange={setShowResonance}
      />
    </div>
  );
};

export default ProfilePage;
