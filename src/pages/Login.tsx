import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Loader2, Sun, CloudSun, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for OAuth callback and redirect to overview
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/overview", { replace: true });
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/overview", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Fields Required",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Good Morning! ☀️", description: "Successfully logged in." });
      navigate("/overview");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/overview`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }
      
      // OAuth will redirect, so we don't need to handle navigation here
      // The redirect will happen automatically
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google.";
      
      if (error?.message) {
        if (error.message.includes('provider is not enabled')) {
          errorMessage = "Google sign-in is not enabled. Please contact support.";
        } else if (error.message.includes('redirect_uri_mismatch')) {
          errorMessage = "OAuth configuration error. Please contact support.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Sign-in Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  } as const;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center selection:bg-primary/30">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 text-yellow-200 opacity-50"
        >
          <Sun className="w-32 h-32" />
        </motion.div>
        <motion.div
          animate={{ x: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-40 left-20 text-muted-foreground/20"
        >
          <CloudSun className="w-24 h-24" />
        </motion.div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        <motion.div
          className="glass-panel p-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="space-y-8">
            <motion.div className="text-center space-y-3" variants={itemVariants}>
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center shadow-lg mx-auto transform rotate-3 hover:rotate-6 transition-transform border border-primary/20">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">Rise & Shine</h2>
              <p className="text-muted-foreground font-medium">Start your daily growth journey</p>
            </motion.div>

            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div className="space-y-2" variants={itemVariants}>
                <Label htmlFor="email" className="text-sm font-semibold text-foreground/90 ml-1">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@morningloop.com"
                    required
                    className="h-12 pl-10 bg-background/50 border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 rounded-xl"
                  />
                </div>
              </motion.div>

              <motion.div className="space-y-2" variants={itemVariants}>
                <Label htmlFor="password" className="text-sm font-semibold text-foreground/90 ml-1">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-12 pl-10 bg-background/50 border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 rounded-xl"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground border-0 text-lg font-bold shadow-lg hover:shadow-primary/25 transition-all duration-300 rounded-xl disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Waking up...</span>
                    </div>
                  ) : (
                    <span>Begin Journey</span>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div className="relative" variants={itemVariants}>
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                <span className="bg-transparent px-2 text-muted-foreground">Or</span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full h-14 bg-card text-card-foreground hover:bg-accent border border-input text-lg font-semibold shadow-lg transition-all duration-300 rounded-xl disabled:opacity-70"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>
            </motion.div>

            <motion.div className="text-center" variants={itemVariants}>
              <Button
                variant="link"
                onClick={() => navigate("/signup")}
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                New here? Create an account
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;