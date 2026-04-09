import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Heart, Trophy, TrendingUp, Check, Star, Clock } from 'lucide-react';

const PLATFORMS: Record<string, {
  name: string;
  tagline: string;
  description: string;
  icon: typeof Heart;
  color: string;
  features: { name: string; desc: string }[];
  gettingStarted: string[];
}> = {
  health: {
    name: 'Aurzo Health',
    tagline: 'Your personal wellness team',
    description: 'Aurzo Health is a comprehensive wellness platform with AI coaching, fitness tracking, meditation guides, habit building, mood logging, and gamification. It includes a full team of virtual specialists — a fitness coach, nutritionist, doctor, and wellness guide — all powered by real data tracking.',
    icon: Heart,
    color: 'from-emerald-500 to-teal-500',
    features: [
      { name: 'AI Health Coach', desc: 'Personalized daily briefs, pattern detection, and what-if scenarios based on your data' },
      { name: 'Fitness & Nutrition', desc: 'Workout decks, interval timers, calorie tracking, and meal logging' },
      { name: 'Meditation & Breathing', desc: 'Guided sessions with 5+ breathing techniques and ambient sounds' },
      { name: 'Habit Tracking', desc: 'Build habits with streaks, milestones, and a library of 18+ templates' },
      { name: 'Sleep & Mood', desc: 'Daily check-ins with mood trends, journaling, and sleep quality tracking' },
      { name: 'Gamification', desc: 'XP system, levels, achievements, and streak rewards to keep you motivated' },
    ],
    gettingStarted: [
      'Log in with your Aurzo credentials',
      'Complete the 6-step wellness onboarding',
      'Set your daily reminder time',
      'Start your first check-in',
    ],
  },
  sports: {
    name: 'Adams Sports News',
    tagline: 'Live scores, fantasy, and AI analytics',
    description: 'Adams Sports News brings you real-time scores from ESPN, AI-powered betting analysis with win probability, fantasy sports tools with player projections and trade analysis, and deep team analytics. Coverage includes NBA, NFL, and Premier League.',
    icon: Trophy,
    color: 'from-blue-500 to-indigo-500',
    features: [
      { name: 'Live Scores', desc: 'Real-time game scores from ESPN across NBA, NFL, and Premier League' },
      { name: 'AI Betting Analysis', desc: 'Win probability models, moneyline/spread analysis, and virtual bankroll tracking' },
      { name: 'Fantasy Tools', desc: '50+ player projections, trade analyzer, waiver wire targets, and injury tracking' },
      { name: 'Team Analytics', desc: 'Deep team stats, player breakdowns, and head-to-head comparisons' },
      { name: 'News Feed', desc: 'Multi-source aggregation from ESPN, Reddit, and more with category detection' },
      { name: 'Analyst Reports', desc: 'League leaders, standings, and detailed performance data' },
    ],
    gettingStarted: [
      'Log in with your Aurzo credentials',
      'Select your favorite sports and teams',
      'Explore the live scores dashboard',
      'Try the AI betting analysis tools',
    ],
  },
  financials: {
    name: 'Aurzo Financials',
    tagline: 'The anti-finance app',
    description: 'Aurzo Financials gives you one number: your Safe to Spend. No jargon, no pie charts, no spreadsheets. It includes budget tracking, savings goals, bill negotiation guides, tax vault planning, investment tracking, and an AI chat advisor that speaks plain English.',
    icon: TrendingUp,
    color: 'from-violet-500 to-purple-500',
    features: [
      { name: 'Safe to Spend', desc: 'One number computed from your accounts, bills, goals, and sweep rules' },
      { name: 'Budget Tracking', desc: 'Category budgets with spend tracking, suggestions, and merchant auto-rules' },
      { name: 'Goals & Investments', desc: 'Savings goals with strategies, plus stock/ETF/crypto portfolio tracking' },
      { name: 'Bill Guides', desc: 'Step-by-step negotiation scripts for insurance, internet, streaming, and more' },
      { name: 'Tax Vault', desc: 'Set aside estimated taxes for freelance/variable income in dedicated vaults' },
      { name: 'AI Chat Advisor', desc: 'Ask what-if questions in plain English and get answers based on your data' },
    ],
    gettingStarted: [
      'Log in with your Aurzo credentials',
      'Complete the conversational onboarding',
      'Add your accounts and monthly income',
      'See your Safe to Spend number',
    ],
  },
};

export default function Platform() {
  const { platformId } = useParams<{ platformId: string }>();
  const navigate = useNavigate();
  const platform = platformId ? PLATFORMS[platformId] : null;

  if (!platform) {
    navigate('/dashboard');
    return null;
  }

  const Icon = platform.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">{platform.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="aurzo-card p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{platform.name}</h1>
              <p className="text-muted-foreground">{platform.tagline}</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6">{platform.description}</p>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium">
            <Check className="w-4 h-4" />
            Active on your account — log in with your Aurzo email and password
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Features</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {platform.features.map((f) => (
              <div key={f.name} className="aurzo-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">{f.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="aurzo-card p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Getting Started</h2>
          <ol className="space-y-3">
            {platform.gettingStarted.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm text-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Access Info */}
        <div className="aurzo-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-3">How to Access</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You can access {platform.name} in two ways:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary">
              <ExternalLink className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground text-sm">Direct URL</p>
                <p className="text-xs text-muted-foreground">Go directly to the platform's website and log in with your Aurzo email and password.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground text-sm">Email Link</p>
                <p className="text-xs text-muted-foreground">Based on your subscriptions, we'll email you direct access links to your products.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
