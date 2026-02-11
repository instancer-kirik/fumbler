import { Settings, Edit3, Shield, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import profile1 from "@/assets/profile-1.jpg";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Profile
        </h1>
        <button className="rounded-full bg-secondary p-2.5">
          <Settings className="h-5 w-5 text-foreground" />
        </button>
      </div>

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
