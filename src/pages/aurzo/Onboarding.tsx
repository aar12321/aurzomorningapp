import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PLATFORMS } from '@/hooks/useSubscription';

// ── Step definitions ──────────────────────────────────────────────────────────
const GOALS = [
  { id: 'learn-daily', emoji: '🎓', label: 'Learn & grow daily' },
  { id: 'master-finance', emoji: '💰', label: 'Master my finances' },
  { id: 'boost-productivity', emoji: '⚡', label: 'Boost my productivity' },
  { id: 'healthy-habits', emoji: '🌿', label: 'Build healthy habits' },
  { id: 'career-growth', emoji: '📈', label: 'Level up my career' },
  { id: 'expand-knowledge', emoji: '🧠', label: 'Expand my knowledge' },
];

const REFERRAL_OPTIONS = [
  { id: 'social-media', label: 'Social media' },
  { id: 'friend', label: 'Friend or colleague' },
  { id: 'search', label: 'Search engine' },
  { id: 'podcast-youtube', label: 'Podcast / YouTube' },
  { id: 'newsletter', label: 'Newsletter / email' },
  { id: 'other', label: 'Other' },
];

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [referralSource, setReferralSource] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill name from auth metadata
  useEffect(() => {
    if (user) {
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        '';
      // Take only the first word as display name
      setDisplayName(name.split(' ')[0] || '');
    }
  }, [user]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id)
        ? prev.filter((g) => g !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const canAdvance = () => {
    if (step === 1) return displayName.trim().length > 0;
    if (step === 2) return selectedGoals.length > 0;
    if (step === 3) return true; // optional
    if (step === 4) return referralSource !== '';
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSaving(true);
    setError('');
    try {
      const { error: upsertError } = await supabase
        .from('aurzo_user_profiles')
        .upsert(
          {
            user_id: user.id,
            display_name: displayName.trim(),
            goals: selectedGoals,
            interests: selectedPlatforms,
            referral_source: referralSource,
            onboarding_completed: true,
            onboarding_step: TOTAL_STEPS,
          },
          { onConflict: 'user_id' }
        );
      if (upsertError) throw upsertError;
      navigate('/plans', { replace: true });
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(38 92% 50%))' }}>
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-foreground">Aurzo</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </header>

      {/* Progress bar */}
      <div className="px-6 pb-2">
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(step / TOTAL_STEPS) * 100}%`,
              background: 'linear-gradient(90deg, hsl(25 95% 53%), hsl(38 92% 50%))',
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Content area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto w-full">
        {/* ── Step 1: Name ───────────────────────────────────────── */}
        {step === 1 && (
          <div className="w-full animate-slide-up">
            <div className="text-center mb-10">
              <div className="text-6xl mb-6">👋</div>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Welcome to Aurzo!
              </h1>
              <p className="text-muted-foreground text-lg">
                Let's personalise your experience. What should we call you?
              </p>
            </div>
            <div className="max-w-sm mx-auto">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your first name or nickname"
                autoFocus
                className="w-full px-5 py-4 rounded-2xl border-2 border-input bg-background text-foreground text-lg text-center placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Goals ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="w-full animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-3">
                What brings you here, {displayName}?
              </h1>
              <p className="text-muted-foreground">
                Pick up to 3 goals that resonate most with you.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {GOALS.map((goal) => {
                const active = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <span className="text-3xl">{goal.emoji}</span>
                    <span className={`font-medium ${active ? 'text-primary' : 'text-foreground'}`}>
                      {goal.label}
                    </span>
                    {active && <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Platform interests ─────────────────────────── */}
        {step === 3 && (
          <div className="w-full animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Which platforms excite you?
              </h1>
              <p className="text-muted-foreground">
                We'll highlight these for you. You can always change this later.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              {PLATFORMS.map((platform) => {
                const active = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    {active && (
                      <CheckCircle2 className="absolute top-3.5 right-3.5 w-5 h-5 text-primary" />
                    )}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                      style={{ background: `linear-gradient(135deg, ${platform.colorFrom}22, ${platform.colorTo}22)` }}
                    >
                      {platform.emoji}
                    </div>
                    <div className="font-semibold text-foreground">{platform.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{platform.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 4: Referral ───────────────────────────────────── */}
        {step === 4 && (
          <div className="w-full animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Almost there!
              </h1>
              <p className="text-muted-foreground">
                How did you hear about Aurzo? (Helps us reach more people like you.)
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto">
              {REFERRAL_OPTIONS.map((option) => {
                const active = referralSource === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setReferralSource(option.id)}
                    className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border-2 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border bg-card hover:border-primary/40 text-foreground'
                    }`}
                  >
                    {option.label}
                    {active && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center max-w-sm">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-4 mt-10 w-full max-w-sm mx-auto">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance() || isSaving}
            className="btn-primary flex-1 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === TOTAL_STEPS ? (
              <>
                Choose My Plan
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Step dots */}
        <div className="flex gap-2 mt-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i + 1 === step ? '24px' : '8px',
                background:
                  i + 1 <= step
                    ? 'hsl(25 95% 53%)'
                    : 'hsl(var(--secondary))',
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
