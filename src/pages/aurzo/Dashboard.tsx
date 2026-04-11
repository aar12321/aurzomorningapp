import { useNavigate, Link } from 'react-router-dom';
import {
  Crown, Star, Zap, ExternalLink, Settings, LogOut,
  Loader2, ArrowRight, Users, Lock, ChevronRight, Bell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, PLATFORMS, PREMIUM_PRICE, INDIVIDUAL_PRICE } from '@/hooks/useSubscription';

// ── Platform card ─────────────────────────────────────────────────────────────
interface PlatformCardProps {
  platform: typeof PLATFORMS[number];
  locked: boolean;
  onLaunch: () => void;
  onAdd: () => void;
}

function PlatformCard({ platform, locked, onLaunch, onAdd }: PlatformCardProps) {
  return (
    <div className={`aurzo-card p-6 flex flex-col transition-all ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{
            background: locked
              ? 'hsl(var(--secondary))'
              : `linear-gradient(135deg, ${platform.colorFrom}22, ${platform.colorTo}22)`,
          }}
        >
          {locked ? <Lock className="w-6 h-6 text-muted-foreground" /> : platform.emoji}
        </div>
        {!locked && (
          <div
            className="w-2.5 h-2.5 rounded-full mt-1"
            style={{ background: platform.colorFrom }}
          />
        )}
      </div>

      <h3 className="font-bold text-foreground text-lg mb-1">{platform.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">{platform.description}</p>

      {/* Feature chips */}
      {!locked && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {platform.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-foreground"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {locked ? (
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Add for ${INDIVIDUAL_PRICE}/mo
        </button>
      ) : (
        <button
          onClick={onLaunch}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-semibold transition-all hover:-translate-y-0.5"
          style={{ background: `linear-gradient(135deg, ${platform.colorFrom}, ${platform.colorTo})` }}
        >
          Open {platform.name}
          <ExternalLink className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { subscription, profile, loading: subLoading, isPremium, hasAccess } = useSubscription();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleLaunch = (platform: typeof PLATFORMS[number]) => {
    if (platform.internalUrl) {
      navigate(platform.internalUrl);
    } else if ('externalUrl' in platform && platform.externalUrl) {
      window.open(platform.externalUrl, '_blank');
    }
  };

  const handleAddPlatform = () => {
    navigate('/plans');
  };

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  const hasAnySub = !!subscription && subscription.status === 'active';
  const hasNoPlan = !hasAnySub;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top navigation ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(38 92% 50%))' }}
            >
              <span className="text-white font-bold text-base">A</span>
            </div>
            <span className="font-bold text-xl text-foreground">Aurzo</span>
            {isPremium && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-600 bg-amber-100">
                <Crown className="w-3 h-3" />
                Premium
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
            </button>
            <Link
              to="/plans"
              className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* ── Welcome header ───────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            {isPremium
              ? "All your Aurzo platforms are ready."
              : hasAnySub
              ? "Your subscribed platforms are ready."
              : "Choose a plan to unlock your Aurzo platforms."}
          </p>
        </div>

        {/* ── No subscription CTA ─────────────────────────────────── */}
        {hasNoPlan && (
          <div
            className="rounded-2xl p-8 mb-10 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(25 95% 53% / 0.08), hsl(38 92% 50% / 0.12))' }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary text-sm uppercase tracking-wide">
                  Get Started
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Unlock the Aurzo ecosystem
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg">
                Choose a platform for $5/month, or go Premium at $15/month to access all four — plus our community, early features & priority support.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/plans')} className="btn-primary">
                  <Crown className="w-4 h-4" />
                  View Plans
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PREMIUM DASHBOARD ────────────────────────────────────── */}
        {isPremium && (
          <>
            {/* Stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Platforms', value: '4', emoji: '⚡' },
                { label: 'Plan', value: 'Premium', emoji: '👑' },
                { label: 'Community', value: 'Active', emoji: '💬' },
                {
                  label: 'Next billing',
                  value: subscription?.next_billing_date
                    ? new Date(subscription.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—',
                  emoji: '📅',
                },
              ].map((stat) => (
                <div key={stat.label} className="aurzo-card p-4 text-center">
                  <div className="text-2xl mb-1">{stat.emoji}</div>
                  <div className="font-bold text-foreground text-lg">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Platform grid */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-5">Your Platforms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {PLATFORMS.map((platform) => (
                  <PlatformCard
                    key={platform.id}
                    platform={platform}
                    locked={false}
                    onLaunch={() => handleLaunch(platform)}
                    onAdd={handleAddPlatform}
                  />
                ))}
              </div>
            </section>

            {/* Community + exclusive perks */}
            <section className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-5">Premium Perks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Discord */}
                <a
                  href="https://discord.gg/aurzo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aurzo-card p-6 flex items-start gap-4 group no-underline"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl shrink-0">
                    💬
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">Aurzo Community</h3>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Join our Discord — connect with fellow Aurzo users, share tips & get support.
                    </p>
                  </div>
                </a>

                {/* Early access */}
                <div className="aurzo-card p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl shrink-0">
                    🚀
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Early Access</h3>
                    <p className="text-sm text-muted-foreground">
                      You're first in line for every new feature, tool & platform we release.
                    </p>
                    <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      Coming soon
                    </span>
                  </div>
                </div>

                {/* Priority support */}
                <div className="aurzo-card p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl shrink-0">
                    🎯
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Priority Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Get responses within 24 hours. Your questions are always our first priority.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Subscription management link */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-secondary">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="font-semibold text-foreground">Aurzo Premium</div>
                  <div className="text-sm text-muted-foreground">
                    ${subscription?.price_monthly}/month
                    {subscription?.next_billing_date && (
                      <> · Renews {new Date(subscription.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                    )}
                  </div>
                </div>
              </div>
              <Link
                to="/plans"
                className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
              >
                Manage
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}

        {/* ── STANDARD DASHBOARD (individual plan) ────────────────── */}
        {hasAnySub && !isPremium && (
          <>
            {/* Subscribed platforms */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-5">Your Platforms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {PLATFORMS.map((platform) => {
                  const unlocked = hasAccess(platform.id);
                  return (
                    <PlatformCard
                      key={platform.id}
                      platform={platform}
                      locked={!unlocked}
                      onLaunch={() => handleLaunch(platform)}
                      onAdd={handleAddPlatform}
                    />
                  );
                })}
              </div>
            </section>

            {/* Upgrade to Premium CTA */}
            <div className="relative rounded-2xl overflow-hidden mb-8">
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, hsl(25 95% 53% / 0.12) 0%, hsl(38 92% 50% / 0.16) 100%)',
                }}
              />
              <div className="relative z-10 p-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-foreground">Unlock Everything with Premium</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Get all 4 platforms + our Discord community + early access to new features — all for just $15/month.
                    {subscription && subscription.platforms.length > 0 && (
                      <span className="text-primary font-medium">
                        {' '}You're {PLATFORMS.length - subscription.platforms.length} platform(s) away from the full experience.
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {PLATFORMS.map((p) => (
                      <span key={p.id} className="text-sm">
                        {p.emoji}
                      </span>
                    ))}
                    <span className="text-sm">+</span>
                    <span className="text-sm">💬 Community</span>
                    <span className="text-sm">🚀 Early access</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="text-center mb-2">
                    <div className="text-3xl font-bold text-foreground">$15</div>
                    <div className="text-xs text-muted-foreground">/month</div>
                  </div>
                  <button onClick={() => navigate('/plans')} className="btn-primary px-6 py-3 whitespace-nowrap">
                    <Crown className="w-4 h-4" />
                    Go Premium
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription management */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-secondary">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Individual Plan</div>
                  <div className="text-sm text-muted-foreground">
                    ${subscription?.price_monthly}/month
                    {subscription?.next_billing_date && (
                      <> · Renews {new Date(subscription.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                    )}
                  </div>
                </div>
              </div>
              <Link to="/plans" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                Manage
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}

        {/* ── PLATFORM PREVIEWS (no plan) ────────────────────────── */}
        {hasNoPlan && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-5">Explore Aurzo Platforms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PLATFORMS.map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  locked
                  onLaunch={() => navigate('/plans')}
                  onAdd={handleAddPlatform}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Community teaser (non-premium) ─────────────────────── */}
        {!isPremium && (
          <div className="mt-8 aurzo-card p-6 flex items-start gap-4 opacity-70">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl shrink-0">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">Aurzo Community</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  Premium
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium to join our Discord community, connect with other learners & get exclusive content.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
