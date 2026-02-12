import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingComplete: boolean | null;
  refreshOnboarding: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  const checkOnboarding = useCallback((userId: string) => {
    supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setOnboardingComplete(data?.onboarding_complete ?? false);
      });
  }, []);

  const refreshOnboarding = useCallback(async () => {
    if (user) checkOnboarding(user.id);
  }, [user, checkOnboarding]);

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboarding(session.user.id);
      }
      setLoading(false);
    });

    // Then listen for changes — no async work inside the callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock with async in callback
          setTimeout(() => checkOnboarding(session.user.id), 0);
        } else {
          setOnboardingComplete(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkOnboarding]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, onboardingComplete, refreshOnboarding, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
