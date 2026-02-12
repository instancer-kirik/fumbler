import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const AppLayout = () => {
  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background">
      <Outlet />
      <BottomNav />
    </div>
  );
};

export default AppLayout;
