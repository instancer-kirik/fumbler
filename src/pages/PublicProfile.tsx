import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ResonanceProfileView from "@/components/ResonanceProfileView";

interface PublicProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
}

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio, age")
        .eq("username", username)
        .maybeSingle();

      if (!data || error) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto max-w-lg min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Profile not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          @{username} doesn't exist or hasn't set up their profile yet.
        </p>
        <button
          onClick={() => navigate("/")}
          className="rounded-2xl gradient-warm px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Go to Fumble
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background px-4 pt-6 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="h-24 w-24 overflow-hidden rounded-full gradient-warm p-[3px] mb-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name || ""} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="h-full w-full rounded-full bg-muted flex items-center justify-center text-2xl font-display text-muted-foreground">
              {profile.full_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">
          {profile.full_name || "Anonymous"}{profile.age ? `, ${profile.age}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio && (
          <p className="mt-2 text-sm text-foreground/80 text-center max-w-xs">{profile.bio}</p>
        )}
      </motion.div>

      {/* Resonance profile sections (public view) */}
      <ResonanceProfileView profile={profile as any} onClose={() => navigate(-1)} viewerRelationship="public" />
    </div>
  );
};

export default PublicProfile;
