import { Sheet, SheetContent } from "@/components/ui/sheet";
import HelpChat from "@/components/profile/HelpChat";

interface HelpSupportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpSupportSheet = ({ open, onOpenChange }: HelpSupportSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="bottom"
      className="z-[70] flex max-h-[90vh] flex-col rounded-t-3xl bg-background p-0"
    >
      <HelpChat />
    </SheetContent>
  </Sheet>
);

export default HelpSupportSheet;
