import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import DiscoverPage from "@/components/DiscoverPage";
import MatchesPage from "@/components/MatchesPage";
import ProfilePage from "@/components/ProfilePage";
import PeoplePage from "@/components/PeoplePage";
import PublicProfile from "@/pages/PublicProfile";
import AppLayout from "@/components/AppLayout";
import About from "./pages/About";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, onboardingComplete } = useAuth();

  // Show loading only while auth is resolving or onboarding check is in-flight
  const isResolving = loading || (user && onboardingComplete === null);

  if (isResolving) {
    return (
      <div className="mx-auto max-w-lg min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (onboardingComplete === false)
    return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Public sharable profile */}
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/about" element={<About />} />

            {/* Authenticated app routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/profile" element={<ProfilePage />} />

            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
