import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RefreshCw, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const WORDS = [
    "APPLE", "BEACH", "BRAIN", "BREAD", "BRUSH", "CHAIR", "CHEST", "CHORD", "CLICK", "CLOCK",
    "CLOUD", "DANCE", "DIARY", "DRINK", "DRIVE", "EARTH", "FEAST", "FIELD", "FRUIT", "GLASS",
    "GRAPE", "GREEN", "GHOST", "GLORY", "GRACE", "HEART", "HORSE", "HOUSE", "IMAGE", "JUICE",
    "LIGHT", "LEMON", "MELON", "MONEY", "MUSIC", "NIGHT", "OCEAN", "PARTY", "PIANO", "PILOT",
    "PHONE", "PIZZA", "PLANT", "PLATE", "POWER", "RADIO", "RIVER", "ROBOT", "SHIRT", "SHOES",
    "SKIRT", "SMILE", "SNAKE", "SPACE", "SPOON", "STORM", "TABLE", "TOAST", "TIGER", "TOOTH",
    "TOUCH", "TOWEL", "TRACK", "TRADE", "TRAIN", "TRUCK", "UNCLE", "UNITY", "VALUE", "VIDEO",
    "VOICE", "WASTE", "WATCH", "WATER", "WHALE", "WHEEL", "WOMAN", "WORLD", "WRITE", "YOUTH",
    "ZEBRA", "ALARM", "AWARD", "BAKER", "BLOCK", "BOARD", "BOOST", "BREAK", "BROWN", "BUILD",
    "CARRY", "CATCH", "CAUSE", "CHAIN", "CHART", "CHECK", "CLASS", "CLEAN", "CLEAR", "CLIMB"
];

const WordDescramble = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [targetWord, setTargetWord] = useState("");
    const [scrambledWord, setScrambledWord] = useState("");
    const [guess, setGuess] = useState("");
    const [streak, setStreak] = useState(0);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<"none" | "correct" | "incorrect">("none");

    useEffect(() => {
        newWord();
    }, []);

    const newWord = () => {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        setTargetWord(word);
        setScrambledWord(scramble(word));
        setGuess("");
        setFeedback("none");
    };

    // Load saved streak/score
    useEffect(() => {
        const saved = localStorage.getItem("descramble_state");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setStreak(parsed.streak || 0);
                setScore(parsed.score || 0);
            } catch (e) {
                console.error("Failed to load descramble state", e);
            }
        }
    }, []);

    // Save streak/score
    useEffect(() => {
        localStorage.setItem("descramble_state", JSON.stringify({ streak, score }));
    }, [streak, score]);

    const scramble = (word: string) => {
        const arr = word.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        // Ensure it's not the same as original
        if (arr.join('') === word) return scramble(word);
        return arr.join('');
    };

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (guess.toUpperCase() === targetWord) {
            setFeedback("correct");
            const newStreak = streak + 1;
            const points = 10 + (newStreak * 5); // Base 10 points + 5 per streak
            setStreak(newStreak);
            setScore(prev => prev + points);
            toast({ title: "Correct! 🎉", description: `+${points} points! Streak: ${newStreak}` });
            saveGameScore("descramble", points, { word: targetWord, streak: newStreak, totalScore: score + points });
            setTimeout(newWord, 1500);
        } else {
            setFeedback("incorrect");
            setStreak(0);
            toast({ title: "Incorrect", description: "Try again!", variant: "destructive" });
        }
    };

    const saveGameScore = async (gameType: string, score: number, metadata: any) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: user } = await supabase
                .from("users")
                .select("id")
                .eq("auth_id", session.user.id)
                .single();

            if (!user) return;

            await supabase.from("game_scores").insert({
                user_id: user.id,
                game_type: gameType,
                score: score,
                metadata: metadata
            });
        } catch (error) {
            console.error("Error saving score:", error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-background text-foreground">
            <div className="w-full max-w-md flex items-center justify-between mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate("/games")} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-2xl font-bold text-foreground">Descramble</h1>
                <div className="flex items-center gap-2">
                    <div className="bg-muted px-3 py-1 rounded-full">
                        <span className="text-xs text-muted-foreground">Score: </span>
                        <span className="text-foreground font-bold">{score}</span>
                    </div>
                    <div className="bg-muted px-3 py-1 rounded-full">
                        <span className="text-xs text-muted-foreground">Streak: </span>
                        <span className="text-foreground font-bold">{streak}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-8 w-full max-w-md mt-10">
                <motion.div
                    key={scrambledWord}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl font-bold text-foreground tracking-widest text-center bg-card/80 backdrop-blur-sm px-8 py-6 rounded-2xl border-2 border-border shadow-lg"
                >
                    {scrambledWord}
                </motion.div>

                <form onSubmit={handleGuess} className="w-full space-y-4">
                    <Input
                        value={guess}
                        onChange={(e) => setGuess(e.target.value.toUpperCase())}
                        placeholder="Type your guess..."
                        className="h-14 text-center text-xl bg-card/90 backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground/50 uppercase tracking-widest shadow-md focus:border-primary focus:ring-2 focus:ring-primary/20"
                        autoFocus
                    />
                    <Button
                        type="submit"
                        className={`w-full h-12 text-lg font-bold transition-colors ${feedback === "correct" ? "bg-green-500 hover:bg-green-600" :
                            feedback === "incorrect" ? "bg-red-500 hover:bg-red-600" :
                                "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {feedback === "correct" ? <Check className="w-6 h-6" /> :
                            feedback === "incorrect" ? <X className="w-6 h-6" /> : "Submit Guess"}
                    </Button>
                </form>

                <Button variant="ghost" onClick={newWord} className="text-muted-foreground hover:text-foreground">
                    Skip Word <RefreshCw className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
};

export default WordDescramble;
