import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import MissedConnectionsPage from "./MissedConnectionsPage";

interface MissedConnectionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MissedConnectionsDrawer = ({ open, onOpenChange }: MissedConnectionsDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full max-w-md overflow-y-auto bg-background p-0 sm:max-w-md">
        <SheetHeader className="px-5 pt-5 pb-2">
          <SheetTitle className="font-display text-xl font-bold text-foreground">
            👀 Missed Connections
          </SheetTitle>
        </SheetHeader>
        <MissedConnectionsPage />
      </SheetContent>
    </Sheet>
  );
};

export default MissedConnectionsDrawer;
