import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowDown, LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const WelcomeHero = () => {
    const navigate = useNavigate();

    return (
        <section className="min-h-[90vh] flex flex-col justify-center items-center relative px-4 py-12 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8 max-w-3xl mx-auto z-10"
            >
                <div className="space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-block px-4 py-1.5 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 text-sm font-medium text-primary mb-4"
                    >
                        ☀️ Start your day right
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight leading-tight">
                        Welcome to your
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                            Morning Routine
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        Kickstart your brain with daily quizzes, micro-games, and challenges.
                        Build habits that stick, in just 5 minutes a day.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    <Button
                        onClick={() => navigate("/login")}
                        size="lg"
                        className="w-full sm:w-auto h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full shadow-xl hover:shadow-primary/20 transition-all duration-300"
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        Log In
                    </Button>
                    <Button
                        onClick={() => navigate("/signup")}
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto h-14 px-8 text-lg border-input text-foreground hover:bg-accent hover:text-accent-foreground font-semibold rounded-full backdrop-blur-sm transition-all duration-300"
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Join Free
                    </Button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-muted-foreground"
            >
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-medium tracking-widest uppercase">Scroll to start</span>
                    <ArrowDown className="w-5 h-5" />
                </div>
            </motion.div>
        </section>
    );
};
