import { ArrowRight, Heart, TrendingUp, Trophy, Shield, Users, Star, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PRODUCTS = [
  {
    id: 'health',
    name: 'Aurzo Health',
    tagline: 'Your personal wellness team',
    description: 'AI-powered health coaching with fitness, nutrition, meditation, mood tracking, and habit building. A full wellness team in your pocket.',
    icon: Heart,
    color: 'from-emerald-500 to-teal-500',
    features: ['AI Health Coach', 'Fitness & Nutrition', 'Meditation & Breathing', 'Habit Tracking', 'Sleep & Mood Logs', 'Gamification & Streaks'],
  },
  {
    id: 'sports',
    name: 'Adams Sports News',
    tagline: 'Live scores, fantasy, and AI analytics',
    description: 'Real-time scores from ESPN, AI-powered betting analysis, fantasy sports tools, and deep team analytics. Everything a sports fan needs.',
    icon: Trophy,
    color: 'from-blue-500 to-indigo-500',
    features: ['Live Scores (ESPN)', 'AI Betting Analysis', 'Fantasy Tools', 'Team & Player Stats', 'Multi-sport Coverage', 'Analyst Reports'],
  },
  {
    id: 'financials',
    name: 'Aurzo Financials',
    tagline: 'The anti-finance app',
    description: 'One number tells you what you can spend. No jargon, no spreadsheets. AI-powered budgeting, goals, bill negotiation guides, and tax planning.',
    icon: TrendingUp,
    color: 'from-violet-500 to-purple-500',
    features: ['Safe to Spend', 'Budget Tracking', 'Goal Planning', 'Bill Negotiation Guides', 'Tax Vault', 'AI Chat Advisor'],
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Early Member',
    quote: 'Aurzo replaced 5 different apps for me. Having everything connected under one account is a game-changer.',
  },
  {
    name: 'James K.',
    role: 'Premium Member',
    quote: 'The health tracking alone is worth it. Add in the financial tools and sports — I use this every single day.',
  },
  {
    name: 'Priya L.',
    role: 'Early Member',
    quote: 'Finally, a platform that actually helps me build better habits instead of just tracking them.',
  },
];

const BENEFITS = [
  {
    icon: Shield,
    title: 'One Account, All Products',
    description: 'Sign up once. Access Aurzo Health, Sports, and Financials with a single login. Manage everything from your dashboard.',
  },
  {
    icon: Users,
    title: 'Join the Aurzo Community',
    description: 'Be part of a growing community focused on living better — health, finances, and the things you love, all connected.',
  },
  {
    icon: Star,
    title: 'Premium Products, Fair Price',
    description: 'Get access to professional-grade tools for health, money, and sports. No hidden fees, no data selling. Just great products.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl text-foreground">Aurzo</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Products</a>
            <a href="#community" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Community</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log In
            </button>
            <button onClick={() => navigate('/signup')} className="btn-primary text-sm !px-5 !py-2.5">
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="max-w-5xl mx-auto text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Star className="w-4 h-4" />
            Now accepting early members
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6">
            A better way to{' '}
            <span className="gradient-text">live, grow,</span>
            <br />
            <span className="gradient-text">and thrive.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Aurzo is your all-in-one platform for health, finances, and the things you love.
            Premium products. One account. One community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/signup')} className="btn-primary text-lg !px-8 !py-4">
              Join Aurzo Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="#products" className="btn-secondary text-lg !px-8 !py-4">
              Explore Products
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. Free tier available on all products.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 px-6 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Three products. One platform.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each product is built to be the best in its category. Together, they give you a complete system for living better.
            </p>
          </div>

          <div className="space-y-8">
            {PRODUCTS.map((product, i) => (
              <div key={product.id} className="aurzo-card p-8 md:p-10">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center`}>
                        <product.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{product.name}</h3>
                        <p className="text-muted-foreground">{product.tagline}</p>
                      </div>
                    </div>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {product.description}
                    </p>
                    <button
                      onClick={() => navigate('/signup')}
                      className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
                    >
                      Get access <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-full lg:w-80 shrink-0">
                    <div className="bg-secondary/80 rounded-xl p-6">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                        What's included
                      </h4>
                      <ul className="space-y-3">
                        {product.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community / Benefits */}
      <section id="community" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Why people choose Aurzo
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're building more than products. We're building a community of people committed to living their best life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="aurzo-card p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="aurzo-card p-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-secondary/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="aurzo-card p-8">
              <h3 className="text-xl font-bold text-foreground mb-1">Free</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">Get started and explore all products</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Access to all three products',
                  'Basic features included',
                  'Single account for everything',
                  'Community access',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/signup')} className="btn-secondary w-full !py-3">
                Get Started Free
              </button>
            </div>

            {/* Premium */}
            <div className="aurzo-card p-8 ring-2 ring-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold rounded-full">
                RECOMMENDED
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Premium</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold gradient-text">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">Full access to every premium feature</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Free',
                  'AI coaching & insights on all platforms',
                  'Advanced analytics & reports',
                  'Premium health features (AI coach, team)',
                  'Full financial tools (sweep, tax vault, goals)',
                  'Sports AI betting analysis & fantasy',
                  'Priority support',
                  'Early access to new features',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/signup')} className="btn-primary w-full !py-3">
                Start Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Coming Soon
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            We're always building. Here's what's next for the Aurzo platform.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: '🛍', title: 'Digital Products', desc: 'Curated guides, templates, and tools from our community' },
              { emoji: '🤝', title: 'Community Forums', desc: 'Connect with other Aurzo members around shared goals' },
              { emoji: '📱', title: 'Mobile Apps', desc: 'Native iOS and Android apps for all Aurzo products' },
            ].map((item) => (
              <div key={item.title} className="aurzo-card p-6 text-center">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-3xl">A</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ready to live better?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of people building healthier, smarter, more connected lives with Aurzo.
          </p>
          <button onClick={() => navigate('/signup')} className="btn-primary text-lg !px-10 !py-4">
            Create Your Free Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-bold text-foreground">Aurzo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your all-in-one platform for a better life.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Aurzo Health</li>
                <li>Adams Sports News</li>
                <li>Aurzo Financials</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Community</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Aurzo Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
