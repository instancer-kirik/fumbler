import { Compass, Heart, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "discover", icon: Compass, label: "Discover", path: "/discover" },
  { id: "matches", icon: Heart, label: "Matches", path: "/matches" },
  { id: "profile", icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeId = navItems.find((item) => location.pathname === item.path)?.id || "discover";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon
                className={`h-6 w-6 transition-all ${isActive ? "text-foreground" : ""}`}
              />
              <span className={`text-[10px] font-semibold ${isActive ? "text-foreground" : ""}`}>{item.label}</span>
              {isActive && (
                <div className="h-1 w-1 rounded-full gradient-warm" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
