import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (isSignUp) {
      toast.success("Check your email to confirm your account!");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            fumble
          </h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full rounded-2xl bg-card px-4 py-3.5 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary placeholder:text-muted-foreground transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl gradient-warm py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity"
          >
            {loading ? "..." : isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-semibold text-primary hover:underline"
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
