import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, X, Loader2, Zap, Crown, Star,
  CreditCard, ArrowLeft, Shield, Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, PLATFORMS, INDIVIDUAL_PRICE, PREMIUM_PRICE } from '@/hooks/useSubscription';

type PlanMode = 'select' | 'individual-config' | 'checkout' | 'success' | 'manage';

interface CheckoutState {
  planType: 'premium' | 'individual';
  platforms: string[];
  priceMonthly: number;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
}

export default function Plans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, loading, refresh } = useSubscription();

  const [mode, setMode] = useState<PlanMode>(() => {
    if (subscription && subscription.status === 'active') return 'manage';
    return 'select';
  });

  const [selectedIndividualPlatforms, setSelectedIndividualPlatforms] = useState<string[]>([]);
  const [checkout, setCheckout] = useState<CheckoutState>({
    planType: 'premium',
    platforms: [],
    priceMonthly: 0,
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Update mode when subscription loads
  useState(() => {
    if (!loading && subscription?.status === 'active') {
      setMode('manage');
    }
  });

  const toggleIndividualPlatform = (id: string) => {
    setSelectedIndividualPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const calcIndividualPrice = () => selectedIndividualPlatforms.length * INDIVIDUAL_PRICE;

  const startCheckout = (planType: 'premium' | 'individual') => {
    const platforms = planType === 'premium' ? PLATFORMS.map((p) => p.id) : selectedIndividualPlatforms;
    const priceMonthly = planType === 'premium' ? PREMIUM_PRICE : calcIndividualPrice();
    setCheckout((prev) => ({ ...prev, planType, platforms, priceMonthly }));
    setMode('checkout');
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError('');

    // Basic validation simulation
    if (checkout.cardNumber.replace(/\s/g, '').length < 16) {
      setCardError('Please enter a valid card number.');
      return;
    }
    if (checkout.cardExpiry.length < 5) {
      setCardError('Please enter a valid expiry date.');
      return;
    }
    if (checkout.cardCvc.length < 3) {
      setCardError('Please enter a valid CVC.');
      return;
    }
    if (!checkout.cardName.trim()) {
      setCardError('Please enter the name on card.');
      return;
    }
    if (!user) return;

    setIsProcessing(true);
    // Simulate payment processing delay
    await new Promise((res) => setTimeout(res, 1800));

    try {
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      // All 4 platforms individually → auto-upgrade to premium
      const isAutoUpgrade =
        checkout.planType === 'individual' &&
        checkout.platforms.length === PLATFORMS.length;

      const finalPlanType = isAutoUpgrade ? 'premium' : checkout.planType;
      const finalPrice = isAutoUpgrade ? PREMIUM_PRICE : checkout.priceMonthly;

      const { error: subError } = await supabase
        .from('aurzo_subscriptions')
        .upsert(
          {
            user_id: user.id,
            plan_type: finalPlanType,
            platforms: checkout.platforms,
            status: 'active',
            price_monthly: finalPrice,
            next_billing_date: nextBilling.toISOString().split('T')[0],
          },
          { onConflict: 'user_id' }
        );
      if (subError) throw subError;

      await refresh();
      setMode('success');
    } catch (err: any) {
      setCardError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('aurzo_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (error) throw error;
      await refresh();
      setCancelConfirm(false);
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpgradeToPremium = () => {
    setCheckout((prev) => ({
      ...prev,
      planType: 'premium',
      platforms: PLATFORMS.map((p) => p.id),
      priceMonthly: PREMIUM_PRICE,
    }));
    setMode('checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(mode === 'checkout' || mode === 'individual-config') && (
            <button onClick={() => setMode('select')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(38 92% 50%))' }}>
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-foreground">
              {mode === 'manage' ? 'My Subscription' : mode === 'checkout' ? 'Checkout' : 'Choose Your Plan'}
            </span>
          </div>
        </div>
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {mode === 'manage' ? 'Back to Dashboard' : 'Skip for now'}
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* ── SUCCESS ─────────────────────────────────────────────── */}
        {mode === 'success' && (
          <div className="flex flex-col items-center text-center py-16 animate-slide-up">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(38 92% 50%))' }}>
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {checkout.planType === 'premium'
                ? "You're Premium! 🎉"
                : `Welcome to Aurzo! 🎉`}
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-md">
              {checkout.planType === 'premium'
                ? "All four Aurzo platforms are now unlocked. Enjoy the full ecosystem."
                : `Your ${checkout.platforms.length} platform${checkout.platforms.length > 1 ? 's are' : ' is'} now active and ready to use.`}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary text-lg px-10 py-4"
            >
              Go to My Dashboard
              <Zap className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── MANAGE SUBSCRIPTION ─────────────────────────────────── */}
        {mode === 'manage' && subscription && (
          <div className="max-w-2xl mx-auto animate-slide-up">
            {/* Current plan card */}
            <div className="aurzo-card p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {subscription.plan_type === 'premium' ? (
                      <Crown className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Star className="w-5 h-5 text-primary" />
                    )}
                    <h2 className="text-xl font-bold text-foreground">
                      {subscription.plan_type === 'premium' ? 'Aurzo Premium' : 'Individual Plan'}
                    </h2>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    subscription.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : subscription.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      subscription.status === 'active' ? 'bg-green-500' : subscription.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">${subscription.price_monthly}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>

              {/* Platforms */}
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {subscription.plan_type === 'premium' ? 'All platforms included' : 'Your platforms'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const hasIt = subscription.plan_type === 'premium' || subscription.platforms.includes(p.id);
                    return (
                      <div key={p.id} className={`flex items-center gap-2.5 p-3 rounded-xl ${hasIt ? 'bg-primary/5' : 'bg-secondary opacity-50'}`}>
                        <span className="text-lg">{p.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${hasIt ? 'text-foreground' : 'text-muted-foreground'}`}>{p.name}</div>
                        </div>
                        {hasIt ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {subscription.next_billing_date && subscription.status === 'active' && (
                <p className="text-sm text-muted-foreground">
                  Next billing:{' '}
                  <span className="font-medium text-foreground">
                    {new Date(subscription.next_billing_date).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </p>
              )}
              {subscription.cancelled_at && (
                <p className="text-sm text-red-600 mt-1">
                  Cancelled on {new Date(subscription.cancelled_at).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Actions */}
            {subscription.status === 'active' && (
              <div className="space-y-3">
                {subscription.plan_type !== 'premium' && (
                  <button
                    onClick={handleUpgradeToPremium}
                    className="btn-primary w-full py-3.5"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Premium — $15/mo
                  </button>
                )}

                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary w-full py-3.5"
                >
                  Back to Dashboard
                </button>

                {!cancelConfirm ? (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="w-full py-3 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Cancel subscription
                  </button>
                ) : (
                  <div className="aurzo-card p-4 border-destructive/30">
                    <p className="text-sm font-medium text-foreground mb-3">
                      Are you sure? You'll lose access to your platforms at the end of your billing period.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="flex-1 py-2.5 rounded-xl bg-destructive text-white font-medium hover:bg-destructive/90 transition-colors text-sm disabled:opacity-60"
                      >
                        {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Yes, cancel'}
                      </button>
                      <button
                        onClick={() => setCancelConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors text-sm"
                      >
                        Keep subscription
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {subscription.status === 'cancelled' && (
              <button onClick={() => setMode('select')} className="btn-primary w-full py-3.5">
                Reactivate subscription
              </button>
            )}
          </div>
        )}

        {/* ── PLAN SELECTION ──────────────────────────────────────── */}
        {mode === 'select' && (
          <div className="animate-slide-up">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-foreground mb-3">Choose your plan</h1>
              <p className="text-xl text-muted-foreground">
                Unlock the Aurzo platforms that fit your life. Cancel anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Individual Plan */}
              <div className="aurzo-card p-7 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Individual</h2>
                    <p className="text-sm text-muted-foreground">Pick the platforms you need</p>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-4xl font-bold text-foreground">$5</span>
                  <span className="text-muted-foreground">/platform/month</span>
                </div>

                {/* Platform checkboxes */}
                <div className="space-y-2.5 mb-6 flex-1">
                  {PLATFORMS.map((p) => {
                    const checked = selectedIndividualPlatforms.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleIndividualPlatform(p.id)}
                          className="sr-only"
                        />
                        <span className="text-xl">{p.emoji}</span>
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.tagline}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          checked ? 'bg-primary border-primary' : 'border-input'
                        }`}>
                          {checked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {selectedIndividualPlatforms.length === PLATFORMS.length && (
                  <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      <strong>Auto-upgrade!</strong> Selecting all 4 platforms automatically upgrades you to Aurzo Premium at $15/mo — saving you $5.
                    </p>
                  </div>
                )}

                {calcIndividualPrice() > 0 && (
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <span className="text-muted-foreground">{selectedIndividualPlatforms.length} platform{selectedIndividualPlatforms.length !== 1 ? 's' : ''}</span>
                    <span className="font-bold text-foreground">
                      ${selectedIndividualPlatforms.length === PLATFORMS.length ? PREMIUM_PRICE : calcIndividualPrice()}/mo
                    </span>
                  </div>
                )}

                <button
                  onClick={() => startCheckout('individual')}
                  disabled={selectedIndividualPlatforms.length === 0}
                  className="btn-secondary w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {selectedIndividualPlatforms.length === 0
                    ? 'Select at least one platform'
                    : `Continue — $${selectedIndividualPlatforms.length === PLATFORMS.length ? PREMIUM_PRICE : calcIndividualPrice()}/mo`}
                </button>
              </div>

              {/* Premium Plan */}
              <div className="relative aurzo-card p-7 flex flex-col border-2 border-primary">
                {/* Best value badge */}
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(90deg, hsl(25 95% 53%), hsl(38 92% 50%))' }}
                >
                  BEST VALUE
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, hsl(25 95% 53% / 0.15), hsl(38 92% 50% / 0.15))' }}>
                    <Crown className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Aurzo Premium</h2>
                    <p className="text-sm text-muted-foreground">Everything, unlocked</p>
                  </div>
                </div>

                <div className="mb-1">
                  <span className="text-4xl font-bold text-foreground">$15</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">vs $20 if bought individually</p>

                {/* All platforms included */}
                <div className="space-y-2.5 mb-6 flex-1">
                  {PLATFORMS.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
                      <span className="text-xl">{p.emoji}</span>
                      <div className="flex-1">
                        <div className="font-medium text-foreground text-sm">{p.name}</div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    </div>
                  ))}

                  {/* Premium extras */}
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    {[
                      { emoji: '💬', label: 'Aurzo Community (Discord)' },
                      { emoji: '🚀', label: 'Early access to new features' },
                      { emoji: '🎯', label: 'Priority support' },
                      { emoji: '📊', label: 'Advanced analytics & insights' },
                    ].map((extra) => (
                      <div key={extra.label} className="flex items-center gap-3 p-2.5">
                        <span className="text-lg">{extra.emoji}</span>
                        <span className="text-sm font-medium text-foreground">{extra.label}</span>
                        <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => startCheckout('premium')}
                  className="btn-primary w-full py-3.5"
                >
                  <Crown className="w-4 h-4" />
                  Get Premium — $15/mo
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              No contracts. Cancel anytime. All prices in USD.
            </p>
          </div>
        )}

        {/* ── CHECKOUT ────────────────────────────────────────────── */}
        {mode === 'checkout' && (
          <div className="max-w-lg mx-auto animate-slide-up">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {checkout.planType === 'premium' ? 'Aurzo Premium' : 'Individual Plan'}
            </h1>
            <p className="text-muted-foreground mb-8">
              ${checkout.priceMonthly}/month — billed monthly, cancel anytime
            </p>

            {/* Order summary */}
            <div className="aurzo-card p-5 mb-6">
              <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
              <div className="space-y-2">
                {checkout.planType === 'premium' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-foreground">Aurzo Premium (all platforms)</span>
                    </div>
                    <span className="text-sm font-medium">${PREMIUM_PRICE}/mo</span>
                  </div>
                ) : (
                  checkout.platforms.map((pid) => {
                    const p = PLATFORMS.find((pl) => pl.id === pid);
                    if (!p) return null;
                    return (
                      <div key={pid} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{p.emoji}</span>
                          <span className="text-sm text-foreground">{p.name}</span>
                        </div>
                        <span className="text-sm font-medium">${INDIVIDUAL_PRICE}/mo</span>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
                <span className="font-semibold text-foreground">Total today</span>
                <span className="text-xl font-bold text-foreground">${checkout.priceMonthly}</span>
              </div>
            </div>

            {/* Payment form */}
            <form onSubmit={handleSubscribe} className="aurzo-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Payment details</h3>
                <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  Secure
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Card number</label>
                <input
                  type="text"
                  value={checkout.cardNumber}
                  onChange={(e) => setCheckout((prev) => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Expiry</label>
                  <input
                    type="text"
                    value={checkout.cardExpiry}
                    onChange={(e) => setCheckout((prev) => ({ ...prev, cardExpiry: formatExpiry(e.target.value) }))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">CVC</label>
                  <input
                    type="text"
                    value={checkout.cardCvc}
                    onChange={(e) => setCheckout((prev) => ({ ...prev, cardCvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Name on card</label>
                <input
                  type="text"
                  value={checkout.cardName}
                  onChange={(e) => setCheckout((prev) => ({ ...prev, cardName: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              {cardError && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                  {cardError}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing…
                  </span>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Subscribe — ${checkout.priceMonthly}/month
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Your subscription will renew automatically each month. Cancel anytime from your account settings.
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
