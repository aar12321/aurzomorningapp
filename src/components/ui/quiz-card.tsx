import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Zap, CheckCircle, Clock, Star, Award } from "lucide-react";
import { motion } from "framer-motion";

interface QuizCardProps {
  topicName: string;
  dayNumber: number;
  completed: boolean;
  totalDays: number;
  xpEarned?: number;
  streak?: number;
  accuracy?: number;
  onStart: () => void;
}

export const QuizCard = ({ 
  topicName, 
  dayNumber, 
  completed, 
  totalDays,
  xpEarned,
  streak = 0,
  accuracy = 0,
  onStart 
}: QuizCardProps) => {
  const progress = (dayNumber / totalDays) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`overflow-hidden border-2 hover:shadow-[var(--shadow-soft)] transition-all duration-300 bg-gradient-card backdrop-blur-sm ${
        completed ? 'border-green-500/50 bg-green-500/5' : 'border-border'
      }`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-semibold">{topicName}</span>
              {completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </motion.div>
              )}
            </div>
            {xpEarned && (
              <span className="flex items-center gap-1 text-sm text-primary font-medium">
                <Zap className="w-4 h-4" />
                {xpEarned} XP
              </span>
            )}
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Day {dayNumber} of {totalDays}</span>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-500">
                <Flame className="w-3 h-3" />
                {streak} day streak
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {accuracy > 0 && (
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>{accuracy}% accuracy</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>2 min</span>
            </div>
          </div>

          <Button 
            onClick={onStart}
            disabled={completed}
            className={`w-full border-0 transition-all ${
              completed 
                ? 'bg-green-500 text-white cursor-not-allowed' 
                : 'bg-gradient-sunrise text-white hover:opacity-90'
            }`}
          >
            {completed ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed Today
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Start Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
