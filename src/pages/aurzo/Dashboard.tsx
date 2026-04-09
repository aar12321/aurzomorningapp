import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Trophy, TrendingUp, ExternalLink, Settings, LogOut,
  User, CreditCard, Bell, ChevronRight, Star, Check, Shield,
  Mail, Calendar
} from 'lucide-react';

const PLATFORMS = [
  {
    id: 'health',
    name: 'Aurzo Health',
    tagline: 'Your personal wellness team',
    icon: Heart,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    url: '/platform/health',
    features: ['AI Health Coach', 'Fitness Tracking', 'Meditation', 'Habit Building'],
    status: 'active',
  },
  {
    id: 'sports',
    name: 'Adams Sports News',
    tagline: 'Live scores and AI analytics',
    icon: Trophy,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    url: '/platform/sports',
    features: ['Live ESPN Scores', 'AI Betting Analysis', 'Fantasy Tools', 'Team Stats'],
    status: 'active',
  },
  {
    id: 'financials',
    name: 'Aurzo Financials',
    tagline: 'The anti-finance app',
    icon: TrendingUp,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    url: '/platform/financials',
    features: ['Safe to Spend', 'Budget Tracking', 'Bill Guides', 'Tax Vault'],
    status: 'active',
  },
];

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  const subscriptions = profile?.subscriptions || [];
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePlatformClick = (platform: typeof PLATFORMS[0]) => {
    // In production, these would be real URLs to the deployed platforms
    // For now, show the platform info
    navigate(`/platform/${platform.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <span className="font-bold text-foreground">Aurzo</span>
              <span className="text-muted-foreground text-sm ml-2">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {getGreeting()}, {displayName.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Manage your subscriptions and access all your Aurzo products.
          </p>
        </div>

        {/* Account Overview Card */}
        <div className="aurzo-card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    Free Plan
                  </span>
                  <span className="text-xs text-muted-foreground">Member since {memberSince}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="btn-secondary text-sm"
            >
              <Settings className="w-4 h-4" />
              Account Settings
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="aurzo-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{subscriptions.length || PLATFORMS.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active Products</p>
          </div>
          <div className="aurzo-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">Free</p>
            <p className="text-xs text-muted-foreground mt-1">Current Plan</p>
          </div>
          <div className="aurzo-card p-4 text-center">
            <p className="text-2xl font-bold gradient-text">$0</p>
            <p className="text-xs text-muted-foreground mt-1">Monthly Cost</p>
          </div>
          <div className="aurzo-card p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <p className="text-2xl font-bold text-foreground">New</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Member Status</p>
          </div>
        </div>

        {/* Your Products */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Your Products</h2>
            <span className="text-sm text-muted-foreground">{PLATFORMS.length} available</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLATFORMS.map((platform) => {
              const isSubscribed = subscriptions.length === 0 || subscriptions.includes(platform.id);
              return (
                <div key={platform.id} className="aurzo-card overflow-hidden group cursor-pointer" onClick={() => handlePlatformClick(platform)}>
                  {/* Header gradient */}
                  <div className={`h-2 bg-gradient-to-r ${platform.color}`} />

                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                        <platform.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{platform.name}</h3>
                        <p className="text-xs text-muted-foreground">{platform.tagline}</p>
                      </div>
                      {isSubscribed && (
                        <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">
                          Active
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {platform.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary hover:bg-muted text-foreground font-medium text-sm transition-colors group-hover:bg-primary group-hover:text-white">
                      Open {platform.name.split(' ')[0]}
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="aurzo-card p-8 mb-10 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Upgrade to Premium
              </h3>
              <p className="text-muted-foreground mb-4">
                Get full access to AI coaching, advanced analytics, and premium features across all products for just $9.99/month.
              </p>
              <div className="flex flex-wrap gap-2">
                {['AI Coaching', 'Advanced Analytics', 'Priority Support', 'Early Access'].map((f) => (
                  <span key={f} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <button className="btn-primary !px-8 !py-3 shrink-0">
              Upgrade Now
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <button onClick={() => navigate('/settings')} className="aurzo-card p-5 flex items-center gap-4 text-left hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">Profile & Settings</h4>
              <p className="text-xs text-muted-foreground">Update your name, email, and preferences</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <button className="aurzo-card p-5 flex items-center gap-4 text-left hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">Billing & Plan</h4>
              <p className="text-xs text-muted-foreground">Manage your subscription and payment</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <button className="aurzo-card p-5 flex items-center gap-4 text-left hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Bell className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">Notifications</h4>
              <p className="text-xs text-muted-foreground">Configure email and product alerts</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <button className="aurzo-card p-5 flex items-center gap-4 text-left hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">Security</h4>
              <p className="text-xs text-muted-foreground">Password, two-factor authentication</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>
        </div>

        {/* Email Delivery Info */}
        <div className="aurzo-card p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">How you'll access your products</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Based on your subscriptions, we'll send you links to each platform at <strong className="text-foreground">{user?.email}</strong>.
                You can also access any product directly from this dashboard or go to the product's URL and log in with your Aurzo credentials.
                Your single Aurzo account works everywhere.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">Aurzo</span>
          </div>
          <p className="text-xs text-muted-foreground">&copy; 2026 Aurzo Inc.</p>
        </div>
      </footer>
    </div>
  );
}
