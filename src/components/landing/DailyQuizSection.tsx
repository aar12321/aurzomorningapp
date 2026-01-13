import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const DailyQuizSection = () => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    // Hardcoded demo question
    const question = {
        text: "What is the term for the tendency to search for information that supports our preconceptions?",
        options: [
            "Confirmation Bias",
            "Cognitive Dissonance",
            "Dunning-Kruger Effect",
            "Availability Heuristic"
        ],
        correctIndex: 0
    };

    const handleAnswer = (index: number) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
        setIsAnswered(true);
    };

    return (
        <section className="py-8 px-4 w-full max-w-md mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <Brain className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Today's Quiz</h2>
                        <p className="text-xs text-muted-foreground">3 questions • ~2 minutes</p>
                    </div>
                </div>

                <Card className="bg-card/50 backdrop-blur-md border-border overflow-hidden">
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-primary uppercase tracking-wider">Question 1 of 3</span>
                            <h3 className="text-lg font-medium text-foreground leading-relaxed">
                                {question.text}
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {question.options.map((option, index) => {
                                let state = "default";
                                if (isAnswered) {
                                    if (index === question.correctIndex) state = "correct";
                                    else if (index === selectedAnswer) state = "incorrect";
                                    else state = "muted";
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(index)}
                                        disabled={isAnswered}
                                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center justify-between group ${state === "default"
                                            ? "bg-card hover:bg-accent text-foreground border border-border hover:border-border/80"
                                            : state === "correct"
                                                ? "bg-green-500/20 border border-green-500/50 text-green-700 dark:text-green-100"
                                                : state === "incorrect"
                                                    ? "bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-100"
                                                    : "bg-card text-muted-foreground opacity-50"
                                            }`}
                                    >
                                        <span className="font-medium">{option}</span>
                                        {state === "correct" && <CheckCircle className="w-5 h-5 text-green-400" />}
                                        {state === "incorrect" && <XCircle className="w-5 h-5 text-red-400" />}
                                    </button>
                                );
                            })}
                        </div>

                        {isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="pt-4 border-t border-white/10"
                            >
                                <p className="text-sm text-muted-foreground mb-4">
                                    {selectedAnswer === question.correctIndex
                                        ? "Correct! You're off to a great start."
                                        : "Not quite, but learning is part of the process!"}
                                </p>
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                    onClick={() => window.location.href = "/login"}
                                >
                                    Login to Continue <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </motion.div>
                        )}
                    </div>
                    <div className="px-6 py-3 bg-muted/50 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground">
                            <span className="text-primary font-semibold">Login required</span> to access your 5 daily quizzes.
                        </p>
                    </div>
                </Card>
            </motion.div>
        </section>
    );
};
