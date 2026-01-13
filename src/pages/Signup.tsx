import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Sun, Sparkles, User, Check, BookOpen, CloudSun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Topic {
    id: string;
    name: string;
    category: string;
}

const Signup = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [reminders, setReminders] = useState(false);
    const [terms, setTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        loadAvailableTopics();
    }, []);

    const loadAvailableTopics = async () => {
        try {
            setLoadingTopics(true);
            const { data: topicsData, error } = await supabase
                .from("topics")
                .select("*")
                .order("category, name");

            if (error) throw error;

            if (topicsData) {
                const EXCLUDED_TOPICS = [
                    'Science – General', 'World Events & Trends', 'World Events', 'Financial Literacy',
                    'Calculus', 'Math – Calculus', 'Business', 'General Science', 'AI & Tech',
                    'SAT/ACT Practice', 'General Knowledge'
                ];

                const filteredTopics = topicsData.filter(topic =>
                    !EXCLUDED_TOPICS.includes(topic.name)
                );

                const uniqueByName = filteredTopics.filter((topic, index, self) =>
                    index === self.findIndex(t => t.name === topic.name)
                );

                const deduplicatedTopics = uniqueByName.filter(topic => {
                    if (topic.name.startsWith('Math – ')) {
                        const baseName = topic.name.replace('Math – ', '');
                        return !uniqueByName.some(t => t.name === baseName);
                    }
                    if (topic.name.startsWith('Science – ')) {
                        const baseName = topic.name.replace('Science – ', '');
                        return !uniqueByName.some(t => t.name === baseName);
                    }
                    return true;
                });

                setAvailableTopics(deduplicatedTopics);
            }
        } catch (error) {
            console.error("Error loading topics:", error);
        } finally {
            setLoadingTopics(false);
        }
    };

    const toggleTopic = (topicId: string) => {
        setSelectedTopics(prev => {
            if (prev.includes(topicId)) {
                return prev.filter(id => id !== topicId);
            }
            if (prev.length >= 5) {
                toast({
                    title: "Limit Reached",
                    description: "You can only select 5 topics.",
                    variant: "destructive",
                });
                return prev;
            }
            return [...prev, topicId];
        });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !firstName || !lastName) {
            toast({ title: "Fields Required", description: "Please fill in all fields.", variant: "destructive" });
            return;
        }
        if (selectedTopics.length !== 5) {
            toast({ title: "Topics Required", description: "Please select exactly 5 topics.", variant: "destructive" });
            return;
        }
        if (!terms) {
            toast({ title: "Terms Required", description: "You must agree to the Terms of Service.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const fullName = `${firstName} ${lastName}`.trim();

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        first_name: firstName,
                        last_name: lastName,
                        reminders_enabled: reminders,
                    },
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // Create user record if not created by trigger
                const { error: userError } = await supabase
                    .from("users")
                    .insert({
                        auth_id: authData.user.id,
                        email: email,
                        full_name: fullName,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        streak_count: 0,
                        total_xp: 0
                    })
                    .select()
                    .maybeSingle();

                // Ignore duplicate key error if trigger already created it
                if (userError && userError.code !== '23505') {
                    console.error("Error creating user record:", userError);
                }

                // Insert topics
                const topicsToInsert = selectedTopics.map(topicId => ({
                    user_id: authData.user!.id, // Use non-null assertion as we checked authData.user
                    topic_id: topicId,
                    current_day: 1,
                    completed_days: 0,
                    unlock_day: 1
                }));

                const { error: topicsError } = await supabase
                    .from("user_topics")
                    .insert(topicsToInsert);

                if (topicsError) throw topicsError;

                toast({ title: "Welcome! ☀️", description: "Account created successfully." });
                navigate("/overview");
            }
        } catch (error: any) {
            console.error("Signup error:", error);
            toast({
                title: "Signup Failed",
                description: error.message || "Could not create account.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (selectedTopics.length !== 5) {
            toast({ title: "Topics Required", description: "Please select exactly 5 topics before signing up with Google.", variant: "destructive" });
            return;
        }
        if (!terms) {
            toast({ title: "Terms Required", description: "You must agree to the Terms of Service.", variant: "destructive" });
            return;
        }

        setIsGoogleLoading(true);
        try {
            // Save pending data for Dashboard to pick up
            const pendingData = {
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`.trim(),
                selectedTopics,
                reminders
            };
            localStorage.setItem('pending_google_signup', JSON.stringify(pendingData));

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
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-10 selection:bg-primary/30">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-10 text-yellow-200 opacity-50"
                >
                    <Sun className="w-32 h-32" />
                </motion.div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-2xl px-4 relative z-10">
                <motion.div
                    className="glass-panel p-8"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <div className="space-y-6">
                        <motion.div className="text-center space-y-2" variants={itemVariants}>
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shadow-lg mx-auto border border-primary/20">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">Create Your Morning Loop</h2>
                            <p className="text-muted-foreground text-sm">Step {step} of 2</p>
                        </motion.div>

                        {step === 1 && (
                            <motion.div variants={itemVariants} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-foreground/90">First Name</Label>
                                        <Input
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Jane"
                                            className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground/90">Last Name</Label>
                                        <Input
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Doe"
                                            className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-foreground/90">Email</Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="jane@example.com"
                                        className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-foreground/90">Password</Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
                                    />
                                </div>
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                                    onClick={() => {
                                        if (firstName && lastName && email && password) setStep(2);
                                        else toast({ title: "Missing Fields", description: "Please fill all fields to continue.", variant: "destructive" });
                                    }}
                                >
                                    Next: Select Topics <Check className="w-4 h-4 ml-2" />
                                </Button>
                                <div className="text-center mt-4">
                                    <Button
                                        variant="link"
                                        onClick={() => navigate("/login")}
                                        className="text-muted-foreground hover:text-foreground text-sm"
                                    >
                                        Already have an account? Log in
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div variants={itemVariants} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-foreground/90 text-lg">Select 5 Topics to Start</Label>
                                    <p className="text-muted-foreground text-sm">Choose the areas you want to grow in daily.</p>
                                </div>

                                {loadingTopics ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {availableTopics.map((topic) => (
                                            <div
                                                key={topic.id}
                                                onClick={() => toggleTopic(topic.id)}
                                                className={`
                          cursor-pointer p-3 rounded-xl border transition-all duration-200 flex items-center gap-2
                          ${selectedTopics.includes(topic.id)
                                                        ? "bg-primary/20 border-primary/50 text-foreground"
                                                        : "bg-background/50 border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
                        `}
                                            >
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedTopics.includes(topic.id) ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                                                    {selectedTopics.includes(topic.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                                                </div>
                                                <span className="text-xs font-medium truncate">{topic.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="text-right text-sm text-muted-foreground">
                                    {selectedTopics.length}/5 Selected
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border/10">
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="reminders"
                                            checked={reminders}
                                            onCheckedChange={(c) => setReminders(c as boolean)}
                                            className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor="reminders"
                                                className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Send me daily reminders
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                Receive a daily email to keep your streak alive.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="terms"
                                            checked={terms}
                                            onCheckedChange={(c) => setTerms(c as boolean)}
                                            className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                        <label
                                            htmlFor="terms"
                                            className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5"
                                        >
                                            I agree to the <span className="underline cursor-pointer">Terms of Service</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Button
                                        onClick={handleSignup}
                                        disabled={isLoading || isGoogleLoading || selectedTopics.length !== 5 || !terms}
                                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg rounded-xl"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Signup"}
                                    </Button>

                                    <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest py-2">
                                        <span className="bg-transparent px-2 text-muted-foreground">Or</span>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading || isGoogleLoading || selectedTopics.length !== 5 || !terms}
                                        className="w-full h-12 bg-card text-card-foreground hover:bg-accent border border-input font-semibold shadow-lg rounded-xl"
                                    >
                                        {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (
                                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                        )}
                                        Sign up with Google
                                    </Button>
                                </div>
                                <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={() => setStep(1)}>
                                    Back to Account Info
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Signup;
