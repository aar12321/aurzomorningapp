import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { Flashcard } from '@/lib/ai-content-service';

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  onComplete?: () => void;
  onClose?: () => void;
  title?: string;
}

export const FlashcardDeck = ({ flashcards, onComplete, onClose, title }: FlashcardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;
  const isLastCard = currentIndex === flashcards.length - 1;

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleNext = () => {
    if (isLastCard) {
      onComplete?.();
    } else {
      setCurrentIndex(prev => prev + 1);
      setCompletedCards(prev => new Set([...prev, currentIndex]));
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!currentCard) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            {title && (
              <h3 className="text-xl font-bold text-white">{title}</h3>
            )}
            <div className="flex items-center gap-4 ml-auto">
              <span className="text-white/60 text-sm font-medium">
                {currentIndex + 1} / {flashcards.length}
              </span>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-8">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Flashcard Container */}
          <div 
            className="relative w-full cursor-pointer mb-8"
            style={{ 
              perspective: '1500px',
              minHeight: '400px'
            }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="relative w-full h-full"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ 
                duration: 0.6, 
                type: 'spring',
                stiffness: 100,
                damping: 15
              }}
              style={{ 
                transformStyle: 'preserve-3d',
                minHeight: '400px'
              }}
            >
              {/* Front of card - Question */}
              <div
                className="absolute inset-0 rounded-3xl p-8 md:p-12 flex flex-col justify-center items-center text-center"
                style={{ 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
              >
                <motion.span 
                  className="text-orange-400 text-xs font-bold uppercase tracking-[0.3em] mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Question
                </motion.span>
                <motion.h2 
                  className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentCard.front}
                </motion.h2>
                <motion.p 
                  className="text-white/40 text-sm flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Tap card to reveal answer
                </motion.p>
              </div>

              {/* Back of card - Answer */}
              <div
                className="absolute inset-0 rounded-3xl p-8 md:p-12 flex flex-col justify-center items-center text-center"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(145deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
                  boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.3)'
                }}
              >
                <motion.span 
                  className="text-white/80 text-xs font-bold uppercase tracking-[0.3em] mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Answer
                </motion.span>
                <motion.p 
                  className="text-xl md:text-2xl lg:text-3xl font-semibold text-white leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentCard.back}
                </motion.p>
                <motion.p 
                  className="text-white/60 text-sm flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Tap to flip back
                </motion.p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </Button>

            <Button
              size="lg"
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/25"
            >
              {isLastCard ? 'Complete' : 'Next'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
