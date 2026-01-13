import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  ArrowRight,
  Sunrise,
  Settings,
  X,
  CheckCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserTopic {
  id: string;
  topic_id: string;
  current_day: number;
  completed_days: number;
  unlock_day?: number;
  topics: { name: string; category: string }[];
  completedToday?: boolean;
}

const MockDashboard = () => {
  // Mock data
  const mockUser = {
    id: "mock-user-id",
    full_name: "Demo User",
    streak_count: 7,
    total_xp: 450
  };

  const mockUserTopics: UserTopic[] = [
    {
      id: "1",
      topic_id: "geometry",
      current_day: 3,
      completed_days: 2,
      unlock_day: 3,
      topics: [{ name: "Math - Geometry", category: "Math" }],
      completedToday: false
    },
    {
      id: "2",
      topic_id: "business",
      current_day: 5,
      completed_days: 4,
      unlock_day: 5,
      topics: [{ name: "Business", category: "Business" }],
      completedToday: false
    },
    {
      id: "3",
      topic_id: "ai",
      current_day: 2,
      completed_days: 1,
      unlock_day: 2,
      topics: [{ name: "AI & Tech", category: "Technology" }],
      completedToday: true
    },
    {
      id: "4",
      topic_id: "financial",
      current_day: 4,
      completed_days: 3,
      unlock_day: 3,
      topics: [{ name: "Financial Literacy", category: "Finance" }],
      completedToday: false
    },
    {
      id: "5",
      topic_id: "english",
      current_day: 1,
      completed_days: 0,
      unlock_day: 1,
      topics: [{ name: "English", category: "Academic" }],
      completedToday: false
    }
  ];

  const mockStats = {
    streak: 7,
    xp: 450,
    accuracy: 85
  };

  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  // Check if quiz can be taken (unlocked and not completed today)
  const canTakeQuiz = (topic: UserTopic) => {
    if (topic.completedToday) {
      return false;
    }
    const unlockDay = topic.unlock_day || 1;
    return unlockDay >= topic.current_day;
  };
  
  // Get the status text for a topic
  const getQuizStatus = (topic: UserTopic) => {
    if (topic.completedToday) {
      return { text: "Completed Today", locked: false, color: "text-green-400" };
    }
    
    const unlockDay = topic.unlock_day || 1;
    if (unlockDay < topic.current_day) {
      return { text: "Tomorrow", locked: true, color: "text-gray-400" };
    }
    
    return { text: "Ready", locked: false, color: "text-blue-300" };
  };

  const startQuiz = (topic: UserTopic) => {
    // In mock mode, just show an alert instead of navigating
    alert(`This is a mock dashboard. In the real app, clicking this would start the ${topicLabel(topic)} quiz for Day ${topic.current_day}.\n\nVisit /dashboard to use the real dashboard.`);
  };

  // Friendly name for greeting
  const firstName = mockUser?.full_name?.split(" ")?.[0] ?? "there";

  // Find next available quiz (unlocked and not completed today)
  const getNextAvailableQuiz = () => {
    return mockUserTopics.find(topic => canTakeQuiz(topic)) || null;
  };

  const nextAvailableQuiz = getNextAvailableQuiz();
  
  // Check if all quizzes are done for today
  const allQuizzesDone = mockUserTopics.length > 0 && 
    mockUserTopics.every(topic => topic.completedToday || !canTakeQuiz(topic));

  const topicLabel = (t?: UserTopic) => {
    if (!t) return "Quiz";
    const topics = Array.isArray(t.topics) ? t.topics[0] : (t.topics as any);
    const topicName = topics?.name;
    const category = topics?.category;
    
    if (category === 'Math' && topicName) {
      const nameWithoutPrefix = topicName.replace(/^Math - /, '');
      return `Math - ${nameWithoutPrefix}`;
    }
    
    return topicName ?? "Quiz";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sunrise className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Aurzo
            </h1>
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded border border-yellow-500/30">
              MOCK
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowSettings(true)}
              size="sm"
              className="!bg-transparent text-white hover:bg-white/10 focus-visible:ring-0 shadow-none border border-white/20 whitespace-nowrap"
            >
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              size="sm"
              className="!bg-transparent text-white hover:bg-white/10 focus-visible:ring-0 shadow-none border border-white/20 whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back Home</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* MOBILE (phones) */}
        <main className="md:hidden min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
          {/* Welcome */}
          <section className="max-w-md mx-auto px-4 pt-6 pb-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-sm text-gray-300">Welcome</p>
              <h1 className="mt-1 text-2xl font-bold text-white">Hi, {firstName}! 👋</h1>
              <p className="mt-2 text-sm text-gray-400">
                Get ready for your daily quiz.
              </p>
            </div>
          </section>

          {/* Quiz list */}
          <section className="max-w-md mx-auto px-4 space-y-3 pb-28">
            {mockUserTopics.map((t) => {
              const status = getQuizStatus(t);
              const name = topicLabel(t);

              const emoji =
                name.includes("Math") ? "📊" :
                name.includes("Science") ? "🔬" :
                name.includes("English") ? "📚" :
                name.includes("Business") ? "💼" :
                name.includes("Financial") ? "💰" :
                name.includes("Knowledge") ? "🧠" :
                name.includes("World") ? "🌍" :
                name.includes("AI") ? "🤖" : "📖";

              return (
                <div
                  key={t.id}
                  className={[
                    "w-full rounded-2xl border p-4 text-left",
                    "border-white/10 bg-white/5 backdrop-blur-sm",
                    status.text === "Completed Today" ? "border-green-500/30 bg-green-500/5" : ""
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{emoji}</div>
                      <div>
                        <div className="font-semibold text-white">{name}</div>
                        <div className="text-xs text-gray-400">Day {t.current_day}</div>
                      </div>
                    </div>
                    <span className={`text-xs ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Floating circular Start button */}
          <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/30 backdrop-blur">
            <div className="max-w-md mx-auto px-4 py-4 flex justify-center">
              {allQuizzesDone ? (
                <div className="w-16 h-16 rounded-full shadow-lg bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              ) : nextAvailableQuiz ? (
                <Button
                  className="w-16 h-16 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 border-0 text-white"
                  onClick={() => startQuiz(nextAvailableQuiz)}
                  aria-label={`Start ${topicLabel(nextAvailableQuiz)} quiz`}
                >
                  <ArrowRight className="w-6 h-6" />
                </Button>
              ) : (
                <div className="w-16 h-16 rounded-full shadow-lg bg-gray-500/20 border-2 border-gray-500/50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* DESKTOP */}
        <main className="hidden md:block min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
          <section className="max-w-5xl mx-auto px-6 pt-10 pb-6">
            {/* Welcome */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <div>
                <p className="text-sm text-gray-300">Welcome</p>
                <h1 className="mt-1 text-4xl font-bold text-white">Hi, {firstName}! 👋</h1>
                <p className="mt-2 text-sm text-gray-400">
                  Pick a quiz below. You can take one quiz per subject each day.
                </p>
              </div>
            </div>
          </section>

          {/* Content grid: Left = quiz list, Right = stats */}
          <section className="max-w-5xl mx-auto px-6 pb-16">
            <div className="grid grid-cols-12 gap-6">
              {/* Quiz List */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <h2 className="text-xl font-semibold text-white">Your Quizzes</h2>

                {mockUserTopics.map((t) => {
                  const status = getQuizStatus(t);
                  const name = topicLabel(t);

                  const emoji =
                    name.includes("Math") ? "📊" :
                    name.includes("Science") ? "🔬" :
                    name.includes("English") ? "📚" :
                    name.includes("Business") ? "💼" :
                    name.includes("Financial") ? "💰" :
                    name.includes("Knowledge") ? "🧠" :
                    name.includes("World") ? "🌍" :
                    name.includes("AI") ? "🤖" : "📖";

                  const canStart = canTakeQuiz(t);
                  
                  return (
                    <div
                      key={t.id}
                      onClick={canStart ? () => startQuiz(t) : undefined}
                      className={`rounded-2xl border p-5 backdrop-blur-sm ${
                        status.text === "Completed Today" 
                          ? "border-green-500/30 bg-green-500/5" 
                          : "border-white/10 bg-white/5"
                      } ${
                        canStart ? "cursor-pointer hover:bg-white/10 transition-all" : "cursor-default"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{emoji}</div>
                          <div>
                            <div className="font-semibold text-white text-lg">{name}</div>
                            <div className="text-xs text-gray-400">Day {t.current_day}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 border-white/20 text-gray-300">
                              Day {t.current_day}
                            </span>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-white/10 text-gray-300">
                              {t.completed_days} completed
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 ${
                                status.text === "Completed Today" 
                                  ? "bg-green-500/20 text-green-300"
                                  : status.text === "Tomorrow"
                                  ? "bg-white/5 text-gray-400"
                                  : "bg-emerald-500/20 text-emerald-300"
                              }`}
                            >
                              {status.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stats / Sidebar */}
              <aside className="col-span-12 lg:col-span-4 space-y-6">
                {/* Streak / XP / Accuracy */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-gray-400">Day Streak</div>
                    <div className="mt-1 text-3xl font-bold text-white">{mockStats.streak}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-gray-400">Total XP</div>
                    <div className="mt-1 text-3xl font-bold text-white">{mockStats.xp}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-gray-400">Accuracy</div>
                    <div className="mt-1 text-3xl font-bold text-white">{mockStats.accuracy}%</div>
                  </div>
                </div>

                {/* Countdown */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="text-sm text-gray-300">until next day unlocks</div>
                  <div className="mt-1 text-xs text-gray-400">
                    Complete today's quizzes to keep your streak alive
                  </div>
                </div>

                {/* Large CTA (mirrors top) */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  {allQuizzesDone ? (
                    <div className="w-full h-12 bg-green-500/20 border-2 border-green-500/50 rounded-lg flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Done for the day! 🎉</span>
                    </div>
                  ) : nextAvailableQuiz ? (
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 border-0 text-white"
                      onClick={() => startQuiz(nextAvailableQuiz)}
                    >
                      Start: {topicLabel(nextAvailableQuiz)} — Day {nextAvailableQuiz.current_day}
                    </Button>
                  ) : (
                    <div className="w-full h-12 bg-gray-500/20 border-2 border-gray-500/50 rounded-lg flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400 font-semibold">No quizzes available</span>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-white/10 max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Mock Dashboard</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-white/60 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-white/80 text-sm">
                  This is a mock dashboard with sample data. Settings are disabled in mock mode.
                </p>
                <p className="text-white/60 text-xs">
                  Visit <code className="bg-white/10 px-2 py-1 rounded">/dashboard</code> for the real dashboard.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockDashboard;

