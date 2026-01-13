import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

export const DailyChallenge = () => {
    const [isCompleted, setIsCompleted] = useState(false);

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
                        <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Challenge of the Day</h2>
                        <p className="text-xs text-muted-foreground">Tiny mindset action</p>
                    </div>
                </div>

                <Card className="bg-gradient-to-br from-primary/10 to-emerald-900/20 backdrop-blur-md border-primary/20 overflow-hidden">
                    <div className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <h3 className="text-lg font-medium text-foreground">
                                "Write down one win from yesterday before you start today."
                            </h3>

                            <button
                                onClick={() => setIsCompleted(!isCompleted)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${isCompleted
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                    : "bg-card text-primary hover:bg-accent"
                                    }`}
                            >
                                {isCompleted ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Completed!
                                    </>
                                ) : (
                                    "I did this"
                                )}
                            </button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </section>
    );
};
