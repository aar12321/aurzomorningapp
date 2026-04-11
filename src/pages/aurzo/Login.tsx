import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
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
    <div className="min-h-screen bg-background flex">
      {/* Left Side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, hsl(25 95% 53% / 0.08) 0%, hsl(38 92% 50% / 0.12) 100%)' }}>
        {/* Background decoration */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(25 95% 53%), transparent)' }} />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(38 92% 50%), transparent)' }} />

        <div className="relative z-10 max-w-md text-center">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg"
            style={{ background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(38 92% 50%))' }}>
            <span className="text-white font-bold text-4xl">A</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Welcome back</h1>
          <p className="text-xl text-muted-foreground mb-10">
            Your Aurzo ecosystem is waiting for you.
          </p>
          <div className="space-y-4 text-left">
            {[
              { emoji: '🌅', label: 'Morning Growth Loop', desc: 'Daily quizzes & learning' },
              { emoji: '💰', label: 'Aurzo Finance', desc: 'Master your money' },
              { emoji: '⚡', label: 'AurzoMorning', desc: 'AI-powered day planning' },
              { emoji: '🌿', label: 'Aurzo Wellness', desc: 'Health & habit tracking' },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <div className="font-semibold text-foreground text-sm">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md"
              style={{ background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(38 92% 50%))' }}>
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Aurzo</h1>
          </div>

          <div className="aurzo-card p-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">Sign in</h2>
            <p className="text-muted-foreground mb-8">
              New to Aurzo?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Create an account
              </Link>
            </p>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-border bg-white hover:bg-secondary transition-colors font-medium text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </button>
            </form>

            {/* Privacy */}
            <div className="flex items-start gap-2.5 mt-6 p-3.5 rounded-xl bg-secondary">
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your data is protected with end-to-end encryption. We never sell your personal information.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-5 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
