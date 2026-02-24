import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Info, X } from "lucide-react";
import { motion } from "framer-motion";

interface HamburgerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMissedConnections: () => void;
}

const menuItems = [
  {
    id: "missed-connections",
    icon: MessageCircle,
    label: "Missed Connections",
    sublabel: "Someone out there is wondering about you",
    emoji: "👀",
  },
  {
    id: "about",
    icon: Info,
    label: "About & Support",
    sublabel: "What this is, and how to keep it alive",
    emoji: "💛",
  },
];

const HamburgerMenu = ({
  open,
  onOpenChange,
  onMissedConnections,
}: HamburgerMenuProps) => {
  const navigate = useNavigate();

  const handleItem = (id: string) => {
    onOpenChange(false);
    if (id === "missed-connections") {
      // slight delay so the menu closes before the next sheet opens
      setTimeout(() => onMissedConnections(), 150);
    } else if (id === "about") {
      navigate("/about");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-72 bg-background p-0 border-r border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <div>
            <p className="font-display text-xl font-bold text-foreground">
              fumbler
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              figure out what works
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="h-px bg-border mx-5 mb-4" />

        {/* Nav items */}
        <nav className="px-3 space-y-1">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => handleItem(item.id)}
              className="flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3.5 text-left hover:bg-card transition-colors group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors text-base">
                {item.emoji}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5 truncate">
                  {item.sublabel}
                </p>
              </div>
            </motion.button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 px-5">
          <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
            built ✨
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
