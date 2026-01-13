import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flashcard } from "@/components/ui/flashcard";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trophy, Target, Clock, ChevronLeft, ChevronRight, Home, Star, Zap, Award, ArrowRight, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { calculateQuizXP } from "@/lib/badge-service";
import { getStreakBonus } from "@/lib/streak-manager";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, answers, timeSpent, topicId, day } = location.state || {};
  const [currentCard, setCurrentCard] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [topicCompleted, setTopicCompleted] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const { width, height } = useWindowSize();
  const { toast } = useToast();

  useEffect(() => {
    if (questions && answers) {
      saveQuizAttempt();
    }
  }, [questions, answers]);

  if (!questions || !answers) {
        navigate("/overview");
    return null;
  }

  const score = questions.reduce((acc: number, q: any, idx: number) => {
    return acc + (answers[idx] === q.correct_answer ? 1 : 0);
  }, 0);

  const percentage = Math.round((score / questions.length) * 100);
  const isPerfect = score === questions.length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveQuizAttempt = async () => {
    if (!topicId || !day) return;

    setIsSaving(true);
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }

      // Get user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", session.user.id)
        .single();

      if (!userData) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        });
        return;
      }

      // Get quiz ID
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("id")
        .eq("topic_id", topicId)
        .eq("day_number", Number(day))
        .single();

      if (!quizData) {
        toast({
          title: "Error",
          description: "Quiz not found",
          variant: "destructive",
        });
        return;
      }

      // Calculate XP
      const isPerfect = score === questions.length;
      const baseXP = score * 10;
      const perfectBonus = isPerfect ? 20 : 0;
      const streakBonus = getStreakBonus(userData.streak_count || 0);
      const totalXP = baseXP + perfectBonus + streakBonus;

      setXpEarned(totalXP);

      // Save quiz attempt
      const { error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: userData.id,
          quiz_id: quizData.id,
          score: score,
          total_questions: questions.length,
          time_taken: timeSpent,
          xp_earned: totalXP,
          answers: answers
        });

      if (attemptError) throw attemptError;

      // Update user stats
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          total_xp: (userData.total_xp || 0) + totalXP,
          last_quiz_date: new Date().toISOString().split('T')[0],
          streak_count: userData.streak_count + (isPerfect ? 1 : 0)
        })
        .eq("id", userData.id);

      if (userUpdateError) throw userUpdateError;

      // Update user_topic progress - mark current day as completed and move to next day
      // current_day is incremented so they can access the next day once unlock_day allows it
      const nextDay = Number(day) + 1;

      // Check if there are more quizzes for this topic
      const { data: nextQuiz, error: quizCheckError } = await supabase
        .from("quizzes")
        .select("id")
        .eq("topic_id", topicId)
        .eq("day_number", nextDay)
        .maybeSingle();

      if (quizCheckError) {
        console.error("Error checking next quiz:", quizCheckError);
      }

      // If no more quizzes exist, delete the topic (user has completed all days)
      if (!nextQuiz) {
        console.log('No next quiz found - topic is complete, deleting...');
        const { error: deleteError } = await supabase
          .from("user_topics")
          .delete()
          .eq("user_id", userData.id)
          .eq("topic_id", topicId);

        if (deleteError) {
          console.error("Error deleting completed topic:", deleteError);
          toast({
            title: "Error",
            description: "Failed to remove completed topic. Please try again.",
            variant: "destructive",
          });
        } else {
          console.log('Topic successfully deleted');
          setTopicCompleted(true);
          setShowCompletionDialog(true);
          toast({
            title: "🎉 Topic Completed!",
            description: "You've finished all days for this topic! You can now replace it with a new topic in Settings.",
            duration: 8000, // Show longer so user can read it
          });
        }
      } else {
        // Update to next day
        const { error: topicUpdateError } = await supabase
          .from("user_topics")
          .update({
            completed_days: Number(day),
            current_day: nextDay
          })
          .eq("user_id", userData.id)
          .eq("topic_id", topicId);

        if (topicUpdateError) throw topicUpdateError;
      }

      // Check and award badges
      const { data: newBadges } = await supabase
        .rpc('check_and_award_badges', { user_id_param: userData.id });

      if (newBadges && newBadges.length > 0) {
        toast({
          title: "New Badge Earned! 🏆",
          description: `You earned the "${newBadges[0].badge_name}" badge! ${newBadges[0].badge_icon}`,
        });
      }

      toast({
        title: "Quiz completed! 🎉",
        description: `You earned ${totalXP} XP!`,
      });

    } catch (error: any) {
      console.error("Error saving quiz attempt:", error);
      toast({
        title: "Error",
        description: "Failed to save quiz results",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-calm py-8 px-4">
      {isPerfect && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      <div className="container max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Trophy className="w-20 h-20 mx-auto mb-6 text-primary animate-bounce" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isPerfect ? "Perfect Score! 🎉" : "Quiz Complete!"}
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            {isPerfect
              ? "You're on fire! Keep up the amazing work."
              : "Great effort! Let's review what you learned."}
          </p>
          <p className="text-lg text-muted-foreground">
            You got {score}/{questions.length} correct in {formatTime(timeSpent)}
          </p>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-card backdrop-blur-sm p-8 rounded-2xl border-2 text-center hover:shadow-lg transition-all">
            <Target className="w-10 h-10 mx-auto mb-4 text-primary" />
            <p className="text-4xl font-bold text-foreground mb-2">{score}/{questions.length}</p>
            <p className="text-sm text-muted-foreground">Questions Correct</p>
            <p className="text-xs text-muted-foreground mt-1">
              {score === questions.length ? "Perfect!" : `${questions.length - score} to improve`}
            </p>
          </div>
          <div className="bg-gradient-card backdrop-blur-sm p-8 rounded-2xl border-2 text-center hover:shadow-lg transition-all">
            <Trophy className="w-10 h-10 mx-auto mb-4 text-secondary" />
            <p className="text-4xl font-bold text-foreground mb-2">{percentage}%</p>
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-xs text-muted-foreground mt-1">
              {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good job!" : "Keep practicing!"}
            </p>
          </div>
          <div className="bg-gradient-card backdrop-blur-sm p-8 rounded-2xl border-2 text-center hover:shadow-lg transition-all">
            <Clock className="w-10 h-10 mx-auto mb-4 text-accent" />
            <p className="text-4xl font-bold text-foreground mb-2">{formatTime(timeSpent)}</p>
            <p className="text-sm text-muted-foreground">Time Taken</p>
            <p className="text-xs text-muted-foreground mt-1">
              {timeSpent < 60 ? "Lightning fast!" : timeSpent < 120 ? "Great pace!" : "Take your time!"}
            </p>
          </div>
        </motion.div>

        {/* XP Earned */}
        <motion.div
          className="bg-gradient-sunrise text-white p-8 rounded-2xl text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-8 h-8" />
            <p className="text-xl font-semibold">XP Earned</p>
          </div>
          <p className="text-6xl font-bold mb-2">+{xpEarned || (score * 10 + (isPerfect ? 20 : 0))}</p>
          {isPerfect && (
            <div className="flex items-center justify-center gap-2 text-lg opacity-90">
              <Star className="w-5 h-5" />
              <span>+20 Bonus for Perfect Score!</span>
            </div>
          )}
          <p className="text-sm opacity-75 mt-2">
            {score * 10} base XP + {isPerfect ? "20" : "0"} bonus
          </p>
        </motion.div>

        {/* Flashcards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Review Your Answers</h2>
            <p className="text-lg text-muted-foreground mb-2">
              Click on cards to see explanations
            </p>
            <p className="text-sm text-muted-foreground">
              {currentCard + 1} of {questions.length} • Use arrows to navigate
            </p>
          </div>

          <div className="relative">
            <Flashcard
              question={questions[currentCard].question_text}
              userAnswer={`${answers[currentCard]}: ${questions[currentCard][`choice_${answers[currentCard].toLowerCase()}`]}`}
              correctAnswer={`${questions[currentCard].correct_answer}: ${questions[currentCard][`choice_${questions[currentCard].correct_answer.toLowerCase()}`]}`}
              explanation={questions[currentCard].explanation}
              isCorrect={answers[currentCard] === questions[currentCard].correct_answer}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentCard(prev => Math.max(0, prev - 1))}
                disabled={currentCard === 0}
                className="hover:bg-primary/5"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-3">
                {questions.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentCard(idx)}
                    className={`w-4 h-4 rounded-full transition-all ${idx === currentCard
                        ? 'bg-primary scale-125 shadow-lg'
                        : answers[idx] === questions[idx].correct_answer
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentCard(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentCard === questions.length - 1}
                className="hover:bg-primary/5"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => {
              // Force refresh by navigating with replace and adding a timestamp
              navigate("/overview", { replace: true, state: { refresh: Date.now() } });
              // Also force a page reload to ensure fresh data
              setTimeout(() => {
                window.location.reload();
              }, 100);
            }}
            className="w-full bg-gradient-sunrise text-white border-0 hover:opacity-90 h-14 text-lg font-semibold"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Motivation or Topic Completion Message */}
          {topicCompleted ? (
            <div className="text-center p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl border-2 border-green-500/50">
              <p className="text-lg font-semibold text-green-400 mb-2">
                🎉 Topic Completed!
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                You've finished all days for this topic! You can now replace it with a new topic.
              </p>
              <p className="text-base font-medium text-foreground">
                Go to <span className="text-green-400">Settings</span> to replace this topic with a new one and keep learning! 🚀
              </p>
            </div>
          ) : (
            <div className="text-center p-6 bg-gradient-card backdrop-blur-sm rounded-2xl border-2 border-border">
              <p className="text-lg text-muted-foreground mb-2">
                Next day unlocks in <span className="font-bold text-foreground">12h 58m</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Keep your momentum going! 🚀
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Topic Completion Dialog - Popup when topic is completed */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-foreground flex items-center gap-2">
              🎉 Topic Completed!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              Congratulations! You've finished all days for this topic. You can now replace it with a new topic.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-600 dark:text-green-400 font-medium text-center">
              Go to <Settings className="inline w-4 h-4 mx-1" /> Settings to replace this topic with a new one and keep learning! 🚀
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowCompletionDialog(false);
                navigate("/overview", { replace: true, state: { refresh: Date.now() } });
                setTimeout(() => {
                  window.location.reload();
                }, 100);
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Results;
