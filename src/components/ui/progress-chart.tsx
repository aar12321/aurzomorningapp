import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Target, Zap, BookOpen } from "lucide-react";

interface ProgressData {
  date: string;
  xp: number;
  accuracy: number;
  quizzes: number;
}

interface TopicProgress {
  topic_name: string;
  completed_quizzes: number;
  total_xp: number;
  accuracy: number;
}

interface ProgressChartProps {
  userId: string;
  className?: string;
}

export const ProgressChart = ({ userId, className = "" }: ProgressChartProps) => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [topicData, setTopicData] = useState<TopicProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics'>('overview');

  useEffect(() => {
    fetchProgressData();
  }, [userId]);

  const fetchProgressData = async () => {
    try {
      // Get daily progress data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attemptsData } = await supabase
        .from("quiz_attempts")
        .select(`
          completed_at,
          xp_earned,
          score,
          total_questions,
          quizzes!inner(
            topics!inner(name)
          )
        `)
        .eq("user_id", userId)
        .gte("completed_at", thirtyDaysAgo.toISOString())
        .order("completed_at", { ascending: true });

      if (attemptsData) {
        // Group by date and calculate daily stats
        const dailyStats = new Map<string, { xp: number; correct: number; total: number; quizzes: number }>();
        
        attemptsData.forEach(attempt => {
          const date = attempt.completed_at.split('T')[0];
          if (!dailyStats.has(date)) {
            dailyStats.set(date, { xp: 0, correct: 0, total: 0, quizzes: 0 });
          }
          const stats = dailyStats.get(date)!;
          stats.xp += attempt.xp_earned;
          stats.correct += attempt.score;
          stats.total += attempt.total_questions;
          stats.quizzes += 1;
        });

        const progressArray = Array.from(dailyStats.entries()).map(([date, stats]) => ({
          date,
          xp: stats.xp,
          accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
          quizzes: stats.quizzes
        }));

        setProgressData(progressArray);

        // Get topic-specific progress
        const topicStats = new Map<string, { completed: number; xp: number; correct: number; total: number }>();
        
        attemptsData.forEach(attempt => {
          const topicName = attempt.quizzes.topics.name;
          if (!topicStats.has(topicName)) {
            topicStats.set(topicName, { completed: 0, xp: 0, correct: 0, total: 0 });
          }
          const stats = topicStats.get(topicName)!;
          stats.completed += 1;
          stats.xp += attempt.xp_earned;
          stats.correct += attempt.score;
          stats.total += attempt.total_questions;
        });

        const topicArray = Array.from(topicStats.entries()).map(([name, stats]) => ({
          topic_name: name,
          completed_quizzes: stats.completed,
          total_xp: stats.xp,
          accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
        }));

        setTopicData(topicArray);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const COLORS = ['#f97316', '#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className={`bg-gradient-card backdrop-blur-sm border-2 border-border rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-card backdrop-blur-sm border-2 border-border rounded-2xl p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Your Progress</h3>
        <p className="text-sm text-muted-foreground">Track your learning journey</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'overview' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-background/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-2 inline" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('topics')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'topics' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-background/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2 inline" />
          By Topic
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelFormatter={(value) => `Date: ${formatDate(value)}`}
              />
              <Line 
                type="monotone" 
                dataKey="xp" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--secondary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="topic_name" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar 
                dataKey="completed_quizzes" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-muted-foreground">
            {activeTab === 'overview' ? 'XP Earned' : 'Quizzes Completed'}
          </span>
        </div>
        {activeTab === 'overview' && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
            <span className="text-muted-foreground">Accuracy %</span>
          </div>
        )}
      </div>

      {progressData.length === 0 && (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No progress data available yet</p>
          <p className="text-sm text-muted-foreground mt-1">Complete some quizzes to see your progress!</p>
        </div>
      )}
    </div>
  );
};