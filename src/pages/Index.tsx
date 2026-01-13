import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WelcomeHero } from "@/components/landing/WelcomeHero";
import { DailyQuizSection } from "@/components/landing/DailyQuizSection";
import { GamesSection } from "@/components/landing/GamesSection";
import { DailyChallenge } from "@/components/landing/DailyChallenge";
import { DailyQuote } from "@/components/landing/DailyQuote";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const redirectingRef = useRef(false);

  // Handle OAuth callback and create user topics
  useEffect(() => {
    let mounted = true;

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted && !redirectingRef.current) {
          console.log("Session found, redirecting to dashboard");
          redirectingRef.current = true;
          navigate("/overview", { replace: true });
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);
      if (event === 'SIGNED_IN' && session && mounted && !redirectingRef.current) {
        console.log("User signed in, redirecting to dashboard");
        redirectingRef.current = true;
        navigate("/overview", { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Main Content Flow */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <WelcomeHero />
        <DailyQuizSection />
        <GamesSection />
        <DailyChallenge />
        <DailyQuote />
      </div>
    </div>
  );
};

export default Index;
