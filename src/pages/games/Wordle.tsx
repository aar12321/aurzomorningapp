import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { validateWord, getDailyWord, warmupWordCache } from "@/lib/wordle-word-service";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

type LetterStatus = "correct" | "present" | "absent" | "empty";

interface LetterEvaluation {
    letter: string;
    status: LetterStatus;
}

/**
 * Evaluate a guess against the target word with proper duplicate letter handling
 * This matches official Wordle behavior:
 * 1. First pass: Mark exact matches (correct position) as "correct"
 * 2. Second pass: Mark remaining letters that exist in target as "present" (yellow)
 * 3. Handle duplicates: Each letter in target can only match once
 */
function evaluateGuess(guess: string, target: string): LetterEvaluation[] {
    const result: LetterEvaluation[] = Array(WORD_LENGTH).fill(null).map((_, i) => ({
        letter: guess[i] || "",
        status: "empty" as LetterStatus
    }));

    // Count remaining letters in target (not yet matched)
    const targetCounts: { [key: string]: number } = {};
    for (let i = 0; i < target.length; i++) {
        targetCounts[target[i]] = (targetCounts[target[i]] || 0) + 1;
    }

    // First pass: Mark exact matches (correct position) as "correct"
    const usedIndices = new Set<number>();
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === target[i]) {
            result[i].status = "correct";
            targetCounts[guess[i]]--;
            usedIndices.add(i);
        }
    }

    // Second pass: Mark remaining letters that exist in target as "present" (yellow)
    // Only if there are still unmatched occurrences of that letter
    for (let i = 0; i < guess.length; i++) {
        if (usedIndices.has(i)) continue; // Already marked as correct

        const letter = guess[i];
        if (targetCounts[letter] > 0) {
            result[i].status = "present";
            targetCounts[letter]--;
        } else {
            result[i].status = "absent";
        }
    }

    return result;
}

const Wordle = () => {
    const { toast } = useToast();
    const navigate = useNavigate();

    const [targetWord, setTargetWord] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [evaluations, setEvaluations] = useState<LetterEvaluation[][]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
    const [wordShake, setWordShake] = useState(false);
    const [gameLocked, setGameLocked] = useState(false);
    const [revealingRow, setRevealingRow] = useState<number | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false); // Lock to prevent concurrent submissions

    useEffect(() => {
        // Warm up cache on mount
        warmupWordCache();
        
        const initGame = async () => {
            setIsLoading(true);
            try {
                const dailyWord = await getDailyWord();
                setTargetWord(dailyWord);
                
                const today = new Date();
                const dateString = today.toISOString().split('T')[0];

                const savedState = localStorage.getItem("word_guess_state");
                if (savedState) {
                    const parsedState = JSON.parse(savedState);
                    if (parsedState.date === dateString && parsedState.targetWord === dailyWord) {
                        setGuesses(parsedState.guesses || []);
                        setEvaluations(parsedState.evaluations || []);
                        setGameState(parsedState.gameState || "playing");
                        if (parsedState.gameState !== "playing") {
                            setGameLocked(true);
                        }
                    } else {
                        localStorage.removeItem("word_guess_state");
                    }
                }
            } catch (error) {
                console.error("Error initializing game:", error);
                toast({
                    title: "Error",
                    description: "Failed to load game. Please refresh.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        
        initGame();
    }, []);

    useEffect(() => {
        if (!targetWord) return;
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const stateToSave = {
            date: dateString,
            targetWord,
            guesses,
            evaluations,
            gameState
        };
        localStorage.setItem("word_guess_state", JSON.stringify(stateToSave));
    }, [guesses, evaluations, gameState, targetWord]);

    const handleKeyClick = useCallback(async (key: string) => {
        // Prevent concurrent executions
        if (gameState !== "playing" || gameLocked || isProcessing) return;

        if (key === "BACKSPACE") {
            if (isProcessing) return; // Don't allow backspace during processing
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (key === "ENTER") {
            // Prevent multiple concurrent submissions
            if (isProcessing || isValidating) return;
            
            if (currentGuess.length !== WORD_LENGTH) {
                setWordShake(true);
                setTimeout(() => setWordShake(false), 500);
                toast({ title: "Too short", description: "Word must be 5 letters", variant: "destructive" });
                return;
            }
            
            // Set processing lock immediately to prevent race conditions
            setIsProcessing(true);
            setIsValidating(true);
            
            try {
                // Validate word via API
                const isValid = await validateWord(currentGuess);
                
                if (!isValid) {
                    setWordShake(true);
                    setTimeout(() => setWordShake(false), 500);
                    toast({ 
                        title: "Not in word list", 
                        description: "This word is not recognized. Try another word.", 
                        variant: "destructive" 
                    });
                    return;
                }

                // Evaluate the guess
                const evaluation = evaluateGuess(currentGuess, targetWord);
                const newGuesses = [...guesses, currentGuess];
                const newEvaluations = [...evaluations, evaluation];
                
                setGuesses(newGuesses);
                setEvaluations(newEvaluations);
                setCurrentGuess("");
                setRevealingRow(newGuesses.length - 1);

                // Check win/loss
                if (currentGuess === targetWord) {
                    setTimeout(() => {
                        setGameState("won");
                        setGameLocked(true);
                        toast({ title: "You Won! 🎉", description: "Great job guessing the word!" });
                        saveGameScore("wordle", MAX_GUESSES - newGuesses.length + 1, { word: targetWord, guesses: newGuesses });
                    }, WORD_LENGTH * 100 + 300);
                } else if (newGuesses.length >= MAX_GUESSES) {
                    setTimeout(() => {
                        setGameState("lost");
                        setGameLocked(true);
                        toast({ title: "Game Over", description: `The word was ${targetWord}`, variant: "destructive" });
                        saveGameScore("wordle", 0, { word: targetWord, guesses: newGuesses });
                    }, WORD_LENGTH * 100 + 300);
                }
            } catch (error) {
                console.error("Error processing guess:", error);
                toast({
                    title: "Error",
                    description: "Failed to validate word. Please try again.",
                    variant: "destructive"
                });
            } finally {
                // Always release the lock
                setIsProcessing(false);
                setIsValidating(false);
            }
        } else {
            // Letter input - only allow if not processing
            if (isProcessing) return;
            if (currentGuess.length < WORD_LENGTH) {
                setCurrentGuess(prev => prev + key);
            }
        }
    }, [gameState, gameLocked, currentGuess, targetWord, guesses, evaluations, toast, isProcessing, isValidating]);

    // Handle keyboard input
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (gameState !== "playing" || gameLocked || isProcessing) return;

            if (e.key === "Backspace") {
                await handleKeyClick("BACKSPACE");
            } else if (e.key === "Enter") {
                await handleKeyClick("ENTER");
            } else if (e.key.length === 1 && /[A-Za-z]/.test(e.key)) {
                await handleKeyClick(e.key.toUpperCase());
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyClick, gameState, gameLocked, isProcessing]);

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

    /**
     * Get the best status for a keyboard key across all guesses
     * Priority: correct > present > absent
     */
    const getKeyStatus = (key: string): "correct" | "present" | "absent" | "default" => {
        let status: "correct" | "present" | "absent" | "default" = "default";
        
        evaluations.forEach(evaluation => {
            evaluation.forEach(({ letter, status: letterStatus }) => {
                if (letter === key) {
                    if (letterStatus === "correct") {
                        status = "correct";
                    } else if (letterStatus === "present" && status !== "correct") {
                        status = "present";
                    } else if (letterStatus === "absent" && status === "default") {
                        status = "absent";
                    }
                }
            });
        });

        return status;
    };

    const getStatusColor = (status: LetterStatus, isKeyboard = false) => {
        switch (status) {
            case "correct":
                return isKeyboard 
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md"
                    : "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/50";
            case "present":
                return isKeyboard
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 shadow-md"
                    : "bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-500/50";
            case "absent":
                return isKeyboard
                    ? "bg-slate-600 hover:bg-slate-700 text-white border-slate-600 opacity-70 shadow-md"
                    : "bg-slate-600 border-slate-600 text-white dark:bg-slate-700 shadow-lg";
            default:
                return isKeyboard
                    ? "bg-muted/90 hover:bg-muted text-foreground border border-border"
                    : "bg-muted/80 border-2 border-border text-foreground";
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading game...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-background text-foreground">
            <header className="w-full max-w-md flex items-center justify-between mb-8">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate("/games")} 
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Back to games"
                >
                    <ArrowLeft className="w-6 h-6" aria-hidden="true" />
                </Button>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">WORDLE</h1>
                <div className="w-10" aria-hidden="true" />
            </header>
            
            {isValidating && (
                <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating word...</span>
                </div>
            )}

            <div className="flex flex-col items-center gap-6 w-full max-w-md">
                <div className={`grid grid-rows-6 gap-2 ${wordShake ? "animate-shake" : ""}`}>
                    {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
                        const guess = guesses[rowIndex];
                        const evaluation = evaluations[rowIndex];
                        const isCurrentRow = rowIndex === guesses.length;
                        const isRevealing = revealingRow === rowIndex;

                        return (
                            <div key={rowIndex} className="grid grid-cols-5 gap-2">
                                {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                                    const letter = isCurrentRow ? currentGuess[colIndex] || "" : (guess?.[colIndex] || "");
                                    const letterEval = evaluation?.[colIndex];
                                    const status = letterEval?.status || "empty";

                                    return (
                                        <motion.div
                                            key={colIndex}
                                            initial={false}
                                            animate={isRevealing ? {
                                                scale: [1, 1.1, 1],
                                                rotateY: [0, 90, 0]
                                            } : {}}
                                            transition={{
                                                delay: colIndex * 0.1,
                                                duration: 0.4,
                                                ease: "easeInOut"
                                            }}
                                            className={`w-14 h-14 sm:w-16 sm:h-16 border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold rounded transition-all ${getStatusColor(status)}`}
                                            role="gridcell"
                                            aria-label={letter ? `${letter}, ${status}` : 'Empty cell'}
                                        >
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: isRevealing ? colIndex * 0.1 + 0.2 : 0 }}
                                            >
                                                {letter}
                                            </motion.span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                <div className="w-full space-y-2">
                    {KEYBOARD_ROWS.map((row, i) => (
                        <div key={i} className="flex justify-center gap-1">
                            {row.map((key) => {
                                const status = getKeyStatus(key);
                                const bgColor = getStatusColor(
                                    status === "default" ? "empty" : status,
                                    true
                                );

                                return (
                                    <motion.button
                                        key={key}
                                        onClick={async () => await handleKeyClick(key)}
                                        whileTap={{ scale: 0.95 }}
                                        className={`h-12 sm:h-14 rounded-md font-semibold transition-all ${key.length > 1 ? "px-3 sm:px-4 text-xs sm:text-sm" : "w-9 sm:w-11 text-base sm:text-lg"} ${bgColor} active:scale-95`}
                                        disabled={isValidating || isProcessing || gameState !== "playing" || gameLocked}
                                        aria-label={key === "BACKSPACE" ? "Delete letter" : key === "ENTER" ? "Submit guess" : `Input ${key}`}
                                    >
                                        {key === "BACKSPACE" ? <Delete className="w-5 h-5 mx-auto" /> : key}
                                    </motion.button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {gameState !== "playing" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-card/80 backdrop-blur-md rounded-2xl text-center space-y-4 border border-border/50 w-full"
                    >
                        <h3 className="text-2xl font-bold text-foreground">
                            {gameState === "won" ? "You Won! 🎉" : "Game Over"}
                        </h3>
                        {gameState === "lost" && (
                            <p className="text-muted-foreground">The word was: <span className="font-bold text-amber-500">{targetWord}</span></p>
                        )}
                        <Button onClick={() => navigate("/games")} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                            Back to Games
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Wordle;
