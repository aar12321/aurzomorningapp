import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sunrise, Zap, Clock, ArrowRight } from "lucide-react";

interface QuizTopic {
  id: string;
  name: string;
  day: number;
  completed: boolean;
}

interface EmailTemplateProps {
  userName: string;
  topics: QuizTopic[];
  streakCount: number;
  totalXP: number;
}

export const EmailTemplate = ({ userName, topics, streakCount, totalXP }: EmailTemplateProps) => {
  return (
    <div className="max-w-2xl mx-auto bg-white p-8 font-sans">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sunrise className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Good morning, {userName}! 👋</h1>
        <p className="text-gray-600">Your daily quizzes are ready. Let's make today count.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{streakCount}</div>
          <div className="text-sm text-orange-700">Day Streak</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{totalXP}</div>
          <div className="text-sm text-yellow-700">Total XP</div>
        </div>
      </div>

      {/* Quizzes */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Quizzes</h2>
        {topics.map((topic) => (
          <Card key={topic.id} className="border-2 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{topic.name}</h3>
                  <p className="text-sm text-gray-600">Day {topic.day} • 2 minutes</p>
                </div>
                <Button className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 hover:opacity-90">
                  Start Quiz
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Motivation */}
      <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white p-6 rounded-lg text-center mb-8">
        <Clock className="w-8 h-8 mx-auto mb-2" />
        <p className="text-lg font-medium mb-2">Complete them today to keep your streak alive!</p>
        <p className="text-sm opacity-90">Next day unlocks in 13h 47m</p>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm">
        <p>Aurzo • Learn something new every day</p>
        <p className="mt-2">
          <a href="#" className="text-orange-600 hover:underline">Unsubscribe</a> • 
          <a href="#" className="text-orange-600 hover:underline ml-2">Update Preferences</a>
        </p>
      </div>
    </div>
  );
};

