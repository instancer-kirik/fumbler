import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import HelpSupportSheet from "@/components/profile/HelpSupportSheet";

const AppLayout = () => {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background">
      <Outlet />
      {!helpOpen && (
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="Ah heck, we’re fumbling this so unrealistically hard — help"
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-3 text-xs font-semibold text-foreground shadow-elevated transition-colors hover:bg-secondary"
        >
          <LifeBuoy className="h-4 w-4 text-primary" />
          <span className="hidden min-[420px]:inline">Ah heck, we’re fumbling this — </span>
          Help
        </button>
      )}
      <BottomNav />
      <HelpSupportSheet open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default AppLayout;
