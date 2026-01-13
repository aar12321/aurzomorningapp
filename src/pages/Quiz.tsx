import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle2, XCircle, Timer, Home, AlertCircle, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import 'katex/dist/katex.min.css';
import BlockMath from "react-katex";
import InlineMath from "react-katex";

interface Question {
  id: string;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_answer: string;
  explanation: string;
}


const Quiz = () => {
  const { topicId, dayNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { width, height } = useWindowSize();

  useEffect(() => {
    console.log("Quiz Component Mounted. Topic:", topicId, "Day:", dayNumber);
  }, [topicId, dayNumber]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [quizId, setQuizId] = useState<string | null>(null);
  const [topicName, setTopicName] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);

  // Refs for timer and validation
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasValidatedRef = useRef(false);

  useEffect(() => {
    if (topicId && dayNumber) {
      validateAndFetchQuiz();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [topicId, dayNumber]);

  useEffect(() => {
    if (!isLoading && !quizCompleted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleQuizComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, quizCompleted]);

  const validateAndFetchQuiz = async () => {
    if (hasValidatedRef.current) return;
    hasValidatedRef.current = true;

    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      // 1. Get user profile
      const { data: userProfile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();

      if (!userProfile) {
        navigate("/");
        return;
      }

      // 2. Get topic details and validate unlock status
      const { data: userTopic, error: topicError } = await supabase
        .from("user_topics")
        .select(`
          current_day, 
          unlock_day, 
          topics (name)
        `)
        .eq("user_id", userProfile.id)
        .eq("topic_id", topicId)
        .single();

      if (topicError || !userTopic) {
        toast({
          title: "Error",
          description: "Topic not found",
          variant: "destructive",
        });
        navigate("/overview");
        return;
      }

      setTopicName(Array.isArray(userTopic.topics)
        ? (userTopic.topics[0] as any)?.name
        : (userTopic.topics as any)?.name || "Quiz");

      const dayNum = parseInt(dayNumber || "1");
      const unlockDay = userTopic.unlock_day || 1;

      // Strict validation: Cannot access future days
      if (dayNum > unlockDay) {
        toast({
          title: "Locked",
          description: `Day ${dayNum} is not yet unlocked!`,
          variant: "destructive",
        });
        navigate("/overview");
        return;
      }

      // 3. Check if already completed TODAY
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      const todayEndStr = todayEnd.toISOString();

      const { data: existingAttempts } = await supabase
        .from("quiz_attempts")
        .select("id, quizzes!inner(topic_id)")
        .eq("user_id", userProfile.id)
        .eq("quizzes.topic_id", topicId)
        .gte("completed_at", todayStart)
        .lte("completed_at", todayEndStr);

      if (existingAttempts && existingAttempts.length > 0) {
        toast({
          title: "Already Completed",
          description: "You have already completed this topic for today!",
        });
        navigate("/overview");
        return;
      }

      // 4. Fetch Quiz Content - verify day_number matches the day parameter
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("id, day_number")
        .eq("topic_id", topicId)
        .eq("day_number", dayNum)
        .maybeSingle();

      // Log for debugging to verify day matches
      if (quizData) {
        console.log(`Quiz loaded: Topic ${topicId}, Day ${dayNum}, Quiz day_number: ${quizData.day_number}`);
        if (quizData.day_number !== dayNum) {
          console.warn(`⚠️ Day mismatch: Expected day ${dayNum}, but quiz has day_number ${quizData.day_number}`);
        }
      }

      if (quizError) throw quizError;

      if (!quizData) {
        toast({
          title: "Coming Soon",
          description: "This quiz is not available yet.",
        });
        navigate("/overview");
        return;
      }

      setQuizId(quizData.id);

      // 5. Fetch Questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizData.id)
        .order('order_number', { ascending: true });

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        toast({
          title: "Error",
          description: "No questions found for this quiz.",
          variant: "destructive",
        });
        navigate("/overview");
        return;
      }

      // Map database questions to component Question interface
      const mappedQuestions: Question[] = questionsData.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        choice_a: q.option_a,
        choice_b: q.option_b,
        choice_c: q.option_c,
        choice_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation
      }));

      setQuestions(mappedQuestions);
    } catch (error: any) {
      console.error("Error loading quiz:", error);
      toast({
        title: "Error Loading Quiz",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      // navigate("/dashboard"); // Commented out to allow debugging
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (choice: string) => {
    if (showFeedback || quizCompleted) return;

    setSelectedAnswer(choice);
    const correct = choice.toLowerCase().trim() === questions[currentQuestionIndex].correct_answer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore((prev) => prev + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500); // Stop confetti after 2.5s
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setIsCorrect(false);
    setShowConfetti(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    setQuizCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !quizId) return;

      // Get user profile id
      const { data: userProfile } = await supabase
        .from("users")
        .select("id, streak_count, total_xp")
        .eq("auth_id", session.user.id)
        .single();

      if (!userProfile) return;

      // Calculate XP (100 per correct answer)
      const xpEarned = score * 100;

      // Prepare answers JSON
      // We need to track this state. For now, let's just save the score/stats.
      // But the DB requires 'answers'. We should probably track the user's choices.
      // Since we didn't track them in a state array, let's send an empty object or basic summary for now to fix the crash.
      // Ideally, we should add `userAnswers` state.
      const answersJson = {
        score: score,
        total: questions.length,
        timestamp: new Date().toISOString()
      };

      // Save attempt
      const { error: attemptError } = await supabase.from("quiz_attempts").insert({
        user_id: userProfile.id,
        quiz_id: quizId,
        score: score,
        total_questions: questions.length,
        completed_at: new Date().toISOString(),
        answers: answersJson,
        time_taken: 120 - timeLeft, // approximate time taken
        xp_earned: xpEarned
      });

      if (attemptError) throw attemptError;

      // Update user stats (XP)
      await supabase
        .from("users")
        .update({
          total_xp: (userProfile.total_xp || 0) + xpEarned
        })
        .eq("id", userProfile.id);

      // Update topic progress
      const { data: currentTopic } = await supabase
        .from("user_topics")
        .select("current_day, completed_days")
        .eq("user_id", userProfile.id)
        .eq("topic_id", topicId)
        .single();

      if (currentTopic) {
        await supabase
          .from("user_topics")
          .update({
            current_day: currentTopic.current_day + 1,
            completed_days: currentTopic.completed_days + 1,
            // Do NOT increment unlock_day so it stays locked until cron/logic updates it
          })
          .eq("user_id", userProfile.id)
          .eq("topic_id", topicId);
      }

    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        title: "Error",
        description: "Failed to save your results.",
        variant: "destructive",
      });
    }
  };

  // Helper to render text with LaTeX
  const renderText = (text: string) => {
    if (!text) return "";

    // Split by LaTeX delimiters
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return <BlockMath key={index}>{part.slice(2, -2)}</BlockMath>;
      } else if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={index}>{part.slice(1, -1)}</InlineMath>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Skeleton Header */}
          <div className="flex justify-between items-center">
            <div className="h-8 w-32 bg-accent/20 rounded animate-pulse" />
            <div className="h-8 w-16 bg-accent/20 rounded animate-pulse" />
          </div>

          {/* Skeleton Progress */}
          <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-accent/30 animate-pulse" />
          </div>

          {/* Skeleton Card */}
          <Card className="bg-card/50 border-border/50 p-8 h-[400px] animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-card/80 backdrop-blur-xl border-border/50 p-8 text-center rounded-3xl shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-2">Quiz Completed!</h2>
            <p className="text-muted-foreground mb-8">You've finished Day {dayNumber} of {topicName}</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-accent/20 rounded-2xl p-4 border border-border/10">
                <div className="text-3xl font-bold text-foreground mb-1">{score}/{questions.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Score</div>
              </div>
              <div className="bg-accent/20 rounded-2xl p-4 border border-border/10">
                <div className="text-3xl font-bold text-foreground mb-1">{score * 100}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">XP Earned</div>
              </div>
            </div>

            <Button
              onClick={() => navigate("/overview")}
              className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Return to Dashboard
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} gravity={0.3} />}

      <div className="w-full max-w-2xl z-10 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center text-foreground">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/overview")}
              className="rounded-full hover:bg-accent"
            >
              <Home className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="font-bold text-lg leading-none">{topicName}</h2>
              <p className="text-xs text-muted-foreground">Day {dayNumber}</p>
            </div>
          </div>

          {/* Timer Display */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeLeft < 30 ? "bg-red-500/20 border-red-500/50 text-red-500 dark:text-red-200" : "bg-accent/50 border-border/50 text-foreground"
            }`}>
            <Timer className="w-4 h-4" />
            <span className="font-mono font-medium">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden flex gap-1">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-full flex-1 rounded-full transition-colors duration-300 ${idx < currentQuestionIndex
                  ? "bg-green-500"
                  : idx === currentQuestionIndex
                    ? "bg-blue-500"
                    : "bg-accent/40"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-card/80 backdrop-blur-xl border-border/50 overflow-hidden rounded-3xl shadow-2xl">
              {/* Timer Progress Line */}
              <motion.div
                className="h-1 bg-blue-500 origin-left"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: timeLeft / 120 }}
                transition={{ duration: 1, ease: "linear" }}
              />

              <div className="p-6 md:p-8 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                    {renderText(currentQuestion.question_text)}
                  </h3>
                </div>

                <div className="grid gap-3">
                  {['a', 'b', 'c', 'd'].map((option) => {
                    const choiceText = currentQuestion[`choice_${option}` as keyof Question];
                    const isSelected = selectedAnswer === option;
                    const isCorrectChoice = currentQuestion.correct_answer.toLowerCase().trim() === option.toLowerCase().trim();

                    let buttonStyle = "bg-accent/10 hover:bg-accent/20 border-border/20 text-foreground";

                    if (showFeedback) {
                      // Always prioritize correct answer - show green
                      if (isCorrectChoice) {
                        buttonStyle = "bg-green-500/30 border-green-500 text-green-700 dark:text-green-100";
                      } else if (isSelected && !isCorrectChoice) {
                        // Only show red if selected AND incorrect
                        buttonStyle = "bg-red-500/20 border-red-500 text-red-700 dark:text-red-100";
                      } else {
                        buttonStyle = "bg-accent/5 border-border/5 text-muted-foreground";
                      }
                    } else if (isSelected) {
                      buttonStyle = "bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-100";
                    }

                    return (
                      <Button
                        key={option}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={showFeedback}
                        className={`w-full justify-start text-left p-4 h-auto min-h-[64px] text-base md:text-lg whitespace-normal border-2 transition-all duration-200 rounded-xl ${buttonStyle}`}
                        style={showFeedback && isCorrectChoice ? {
                          backgroundColor: 'rgba(34, 197, 94, 0.3) !important',
                          borderColor: 'rgb(34, 197, 94) !important',
                          color: 'rgb(209, 250, 229) !important'
                        } : showFeedback && isSelected && !isCorrectChoice ? {
                          backgroundColor: 'rgba(239, 68, 68, 0.2) !important',
                          borderColor: 'rgb(239, 68, 68) !important',
                          color: 'rgb(254, 226, 226) !important'
                        } : undefined}
                      >
                        <div className="flex items-start gap-4 w-full">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 text-sm font-bold mt-0.5 ${showFeedback && isCorrectChoice
                            ? "bg-green-500 border-green-500 text-white"
                            : showFeedback && isSelected && !isCorrectChoice
                              ? "bg-red-500 border-red-500 text-white"
                              : "border-current opacity-50"
                            }`}>
                            {option.toUpperCase()}
                          </div>
                          <span className="flex-1 pt-1">{renderText(choiceText)}</span>
                          {showFeedback && isCorrectChoice && (
                            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                          )}
                          {showFeedback && isSelected && !isCorrectChoice && (
                            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Section */}
              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`border-t ${isCorrect ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}
                  >
                    <div className="p-6 md:p-8 space-y-4">
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                        )}
                        <div className="space-y-2">
                          <h4 className={`font-bold text-lg ${isCorrect ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                            {isCorrect ? "Correct!" : "Incorrect"}
                          </h4>
                          <p className="text-foreground/80 leading-relaxed">
                            {renderText(currentQuestion.explanation)}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleNextQuestion}
                        className={`w-full h-12 text-lg font-semibold shadow-lg transition-all ${isCorrect
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/20"
                          : "bg-accent hover:bg-accent/80 text-foreground"
                          }`}
                      >
                        {currentQuestionIndex < questions.length - 1 ? (
                          <>
                            Next Question
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        ) : (
                          "Finish Quiz"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz;
