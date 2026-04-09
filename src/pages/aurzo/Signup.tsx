import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowLeft, Check, Heart, Trophy, TrendingUp, Shield, Star } from 'lucide-react';

type Step = 'account' | 'interests' | 'plan' | 'welcome';

const PRODUCTS = [
  {
    id: 'health',
    name: 'Aurzo Health',
    desc: 'Wellness coaching, fitness, meditation, habits, mood tracking',
    icon: Heart,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'sports',
    name: 'Adams Sports News',
    desc: 'Live scores, fantasy tools, AI betting analysis, team stats',
    icon: Trophy,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'financials',
    name: 'Aurzo Financials',
    desc: 'Budgeting, goals, bill guides, tax vault, AI advisor',
    icon: TrendingUp,
    color: 'from-violet-500 to-purple-500',
  },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, signIn, updateProfile } = useAuth();

  const [step, setStep] = useState<Step>('account');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('free');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleAccountSubmit = async () => {
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password, fullName);
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    // Auto sign in after signup
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError('Account created! Please log in.');
      navigate('/login');
      return;
    }

    setStep('interests');
  };

  const handleInterestsSubmit = () => {
    if (selectedProducts.length === 0) {
      setError('Select at least one product to continue');
      return;
    }
    setError('');
    setStep('plan');
  };

  const handlePlanSubmit = async () => {
    setLoading(true);
    await updateProfile({
      subscriptions: selectedProducts,
      onboarded: true,
    });
    setLoading(false);
    setStep('welcome');
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  const stepIndex = ['account', 'interests', 'plan', 'welcome'].indexOf(step);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-primary/10 via-accent/5 to-background items-center justify-center p-12 relative overflow-hidden">
        <div className="max-w-md text-center relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-3xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Welcome to Aurzo
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your all-in-one platform for health, finances, and the things you love.
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3">
            {['Account', 'Interests', 'Plan', 'Welcome'].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${i <= stepIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${i < stepIndex ? 'bg-primary text-white' : i === stepIndex ? 'bg-primary/20 text-primary ring-2 ring-primary' : 'bg-secondary text-muted-foreground'}`}>
                    {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden xl:block">{label}</span>
                </div>
                {i < 3 && <div className={`w-6 h-0.5 ${i < stepIndex ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Join Aurzo</h1>
          </div>

          {/* Step 1: Account */}
          {step === 'account' && (
            <div className="aurzo-card p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-2">Create your account</h2>
              <p className="text-muted-foreground mb-6">One account for all Aurzo products.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="search-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="search-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="search-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="search-input"
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAccountSubmit}
                  disabled={loading}
                  className="btn-primary w-full !py-3"
                >
                  {loading ? 'Creating account...' : 'Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-3 mt-6 p-4 rounded-xl bg-secondary">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Your data is encrypted and secure. We never sell your personal information.
                </p>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 'interests' && (
            <div className="aurzo-card p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-2">What are you interested in?</h2>
              <p className="text-muted-foreground mb-6">
                Select the products you'd like to use. You can always change this later.
              </p>

              <div className="space-y-4 mb-6">
                {PRODUCTS.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all
                        ${isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border bg-card hover:border-primary/30'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center shrink-0`}>
                          <product.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{product.name}</h3>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                              ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{product.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('account')} className="btn-secondary !py-3 px-4">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button onClick={handleInterestsSubmit} className="btn-primary flex-1 !py-3">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Plan */}
          {step === 'plan' && (
            <div className="aurzo-card p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-2">Choose your plan</h2>
              <p className="text-muted-foreground mb-6">
                Start free and upgrade anytime. Premium unlocks all features.
              </p>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => setSelectedPlan('free')}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all
                    ${selectedPlan === 'free'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">Free</h3>
                    <span className="text-2xl font-bold text-foreground">$0<span className="text-sm text-muted-foreground font-normal">/mo</span></span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access all products with basic features. Perfect for getting started.
                  </p>
                </button>

                <button
                  onClick={() => setSelectedPlan('premium')}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all relative
                    ${selectedPlan === 'premium'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
                    }`}
                >
                  <div className="absolute -top-2.5 right-4 px-3 py-0.5 bg-gradient-to-r from-primary to-accent text-white text-[10px] font-bold rounded-full uppercase">
                    Best Value
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">Premium</h3>
                    <span className="text-2xl font-bold gradient-text">$9.99<span className="text-sm text-muted-foreground font-normal">/mo</span></span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Full access to every feature across all products.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['AI Coaching', 'Advanced Analytics', 'Priority Support', 'Early Access'].map((f) => (
                      <span key={f} className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('interests')} className="btn-secondary !py-3 px-4">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button onClick={handlePlanSubmit} disabled={loading} className="btn-primary flex-1 !py-3">
                  {loading ? 'Setting up...' : 'Complete Setup'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Welcome */}
          {step === 'welcome' && (
            <div className="aurzo-card p-8 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to Aurzo, {fullName.split(' ')[0]}!
              </h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Your account is set up. Head to your dashboard to start exploring your products and manage your subscriptions.
              </p>

              <div className="space-y-3 mb-8">
                {selectedProducts.map((id) => {
                  const product = PRODUCTS.find((p) => p.id === id);
                  if (!product) return null;
                  return (
                    <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center`}>
                        <product.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Ready to use</p>
                      </div>
                      <Check className="w-5 h-5 text-primary ml-auto" />
                    </div>
                  );
                })}
              </div>

              <button onClick={handleFinish} className="btn-primary w-full !py-3 text-lg">
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
