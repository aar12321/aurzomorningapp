import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, RotateCcw, Lightbulb } from "lucide-react";

interface FlashcardProps {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}

export const Flashcard = ({
  question,
  userAnswer,
  correctAnswer,
  explanation,
  isCorrect
}: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="perspective-1000 min-h-[400px] max-w-2xl mx-auto">
      <motion.div
        className="relative w-full h-full cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{ transformStyle: "preserve-3d" }}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Flip to see question" : "Flip to see answer"}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsFlipped(!isFlipped);
          }
        }}
      >
        {/* Front of card */}
        <Card
          className="absolute inset-0 p-8 backface-hidden bg-gradient-card backdrop-blur-sm border-2 shadow-[var(--shadow-soft)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Question</p>
              </div>
              <p className="text-xl font-semibold mb-8 leading-relaxed">{question}</p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-border bg-background/50">
                  <p className="text-sm text-muted-foreground mb-2">Your Answer</p>
                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    <p className={`font-semibold text-lg ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                      {userAnswer}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RotateCcw className="w-4 h-4" />
                <span>Click to see explanation</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Back of card */}
        <Card
          className="absolute inset-0 p-8 backface-hidden bg-primary text-primary-foreground border-0 shadow-[var(--shadow-glow)]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 opacity-90" />
                <p className="text-sm font-medium opacity-90 uppercase tracking-wide">Correct Answer</p>
              </div>
              <p className="text-2xl font-bold mb-8">{correctAnswer}</p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10">
                  <p className="text-sm opacity-90 mb-2">Explanation</p>
                  <p className="text-base leading-relaxed">{explanation}</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm opacity-75">
                <RotateCcw className="w-4 h-4" />
                <span>Click to flip back</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
