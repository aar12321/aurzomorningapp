import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  BookOpen,
  Target,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  order_number: number;
}

interface QuizCreatorProps {
  topicId: string;
  dayNumber: number;
  onComplete: () => void;
  onCancel: () => void;
}

export const QuizCreator = ({ topicId, dayNumber, onComplete, onCancel }: QuizCreatorProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: 'A',
    explanation: "",
    order_number: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const totalSteps = 4; // 3 questions + review

  const handleNext = () => {
    if (currentStep < totalSteps) {
      if (currentStep <= 3) {
        // Save current question
        const updatedQuestions = [...questions];
        updatedQuestions[currentStep - 1] = { ...currentQuestion, order_number: currentStep };
        setQuestions(updatedQuestions);
        
        // Reset for next question
        setCurrentQuestion({
          question_text: "",
          option_a: "",
          option_b: "",
          option_c: "",
          option_d: "",
          correct_answer: 'A',
          explanation: "",
          order_number: currentStep + 1
        });
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      if (currentStep <= 4) {
        // Load previous question
        const prevQuestion = questions[currentStep - 2];
        if (prevQuestion) {
          setCurrentQuestion(prevQuestion);
        }
      }
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSaveQuiz = async () => {
    setIsLoading(true);
    
    try {
      // Validate that we have exactly 3 questions
      if (questions.length !== 3) {
        throw new Error(`Quiz must have exactly 3 questions, but you have ${questions.length}.`);
      }

      // Create quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          topic_id: topicId,
          day_number: dayNumber
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions
      const questionsToInsert = questions.map((q, index) => ({
        quiz_id: quizData.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        order_number: index + 1
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Success! 🎉",
        description: `Quiz for Day ${dayNumber} created successfully with ${questions.length} questions.`,
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentStepValid = () => {
    if (currentStep > 3) return true;
    
    return currentQuestion.question_text.trim() !== "" &&
           currentQuestion.option_a.trim() !== "" &&
           currentQuestion.option_b.trim() !== "" &&
           currentQuestion.option_c.trim() !== "" &&
           currentQuestion.option_d.trim() !== "" &&
           currentQuestion.explanation.trim() !== "";
  };

  return (
    <div className="min-h-screen bg-gradient-calm py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">Create Quiz</h1>
          <p className="text-muted-foreground">Day {dayNumber} • 3 Questions</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentStep <= 3 ? (
            <motion.div
              key={`question-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Question {currentStep}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Text */}
                  <div>
                    <Label htmlFor="question" className="text-base font-medium">
                      Question Text *
                    </Label>
                    <Textarea
                      id="question"
                      value={currentQuestion.question_text}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                      placeholder="Enter your question here..."
                      className="mt-2 min-h-[100px]"
                      required
                    />
                  </div>

                  {/* Answer Options */}
                  <div className="grid grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <div key={option}>
                        <Label htmlFor={`option_${option.toLowerCase()}`} className="text-sm font-medium">
                          Option {option} *
                        </Label>
                        <Input
                          id={`option_${option.toLowerCase()}`}
                          value={currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string}
                          onChange={(e) => setCurrentQuestion(prev => ({ 
                            ...prev, 
                            [`option_${option.toLowerCase()}`]: e.target.value 
                          }))}
                          placeholder={`Option ${option}...`}
                          className="mt-1"
                          required
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct Answer */}
                  <div>
                    <Label htmlFor="correct_answer" className="text-base font-medium">
                      Correct Answer *
                    </Label>
                    <Select
                      value={currentQuestion.correct_answer}
                      onValueChange={(value: 'A' | 'B' | 'C' | 'D') => 
                        setCurrentQuestion(prev => ({ ...prev, correct_answer: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Option A</SelectItem>
                        <SelectItem value="B">Option B</SelectItem>
                        <SelectItem value="C">Option C</SelectItem>
                        <SelectItem value="D">Option D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Explanation */}
                  <div>
                    <Label htmlFor="explanation" className="text-base font-medium">
                      Explanation *
                    </Label>
                    <Textarea
                      id="explanation"
                      value={currentQuestion.explanation}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                      placeholder="Explain why this is the correct answer..."
                      className="mt-2 min-h-[80px]"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Review Quiz
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold">Question {index + 1}</h4>
                          <Badge variant="outline">{question.correct_answer}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{question.question_text}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-muted rounded text-center">A</span>
                            <span>{question.option_a}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-muted rounded text-center">B</span>
                            <span>{question.option_b}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-muted rounded text-center">C</span>
                            <span>{question.option_c}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-muted rounded text-center">D</span>
                            <span>{question.option_d}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          className="flex items-center justify-between mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <div className="flex items-center gap-2">
            {currentStep <= 3 ? (
              <Button
                onClick={handleNext}
                disabled={!isCurrentStepValid() || isLoading}
              >
                {currentStep === 3 ? 'Review' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSaveQuiz}
                disabled={isLoading}
                className="bg-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Quiz'}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
