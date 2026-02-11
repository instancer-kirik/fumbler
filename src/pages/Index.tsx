import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import DiscoverPage from "@/components/DiscoverPage";
import MatchesPage from "@/components/MatchesPage";
import ProfilePage from "@/components/ProfilePage";

const Index = () => {
  const [activePage, setActivePage] = useState("discover");

  const renderPage = () => {
    switch (activePage) {
      case "discover":
        return <DiscoverPage />;
      case "matches":
      case "messages":
        return <MatchesPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <DiscoverPage />;
    }
  };

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background">
      {renderPage()}
      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
};

export default Index;
