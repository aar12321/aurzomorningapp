import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Clock } from "lucide-react";
import { motion } from "framer-motion";

const DailyQuiz = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center"
      >
        <div className="space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-foreground">
            Daily Current Events Quiz
          </h1>

          <p className="text-muted-foreground text-lg">
            Stay informed with daily current events and news quizzes!
          </p>

          <div className="rounded-xl border border-border/50 bg-accent/20 p-6 text-left space-y-4">
            <p className="text-foreground/80">
              📰 Questions about today's news and current events
            </p>
            <p className="text-foreground/80">
              ⚡ Quick 2-minute quizzes to stay informed
            </p>
            <p className="text-foreground/80">
              🎯 Test your knowledge of world events
            </p>
          </div>

          <div className="pt-4">
            <p className="text-muted-foreground mb-4">
              Questions are coming soon! Check back later.
            </p>

            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Back Home
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DailyQuiz;

