import { Toaster } from "@/components/ui/toaster";
import { useEffect, lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useSubscription } from "./hooks/useSubscription";

// ── Aurzo Pages ───────────────────────────────────────────────────────────────
const AurzoLanding    = lazy(() => import("./pages/aurzo/Landing"));
const AurzoLogin      = lazy(() => import("./pages/aurzo/Login"));
const AurzoSignup     = lazy(() => import("./pages/aurzo/Signup"));
const AurzoOnboarding = lazy(() => import("./pages/aurzo/Onboarding"));
const AurzoDashboard  = lazy(() => import("./pages/aurzo/Dashboard"));
const AurzoPlans      = lazy(() => import("./pages/aurzo/Plans"));
const AurzoHome       = lazy(() => import("./pages/aurzo/Home"));
const AurzoTools      = lazy(() => import("./pages/aurzo/Tools"));
const AurzoToolPage   = lazy(() => import("./pages/aurzo/ToolPage"));

// ── Legacy Pages ──────────────────────────────────────────────────────────────
const Index    = lazy(() => import("./pages/Index"));
const Login    = lazy(() => import("./pages/Login"));
const Signup   = lazy(() => import("./pages/Signup"));
const Admin    = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Overview  = lazy(() => import("./pages/Overview"));

// ── Loading UI ────────────────────────────────────────────────────────────────
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse"
        style={{ background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(38 92% 50%))' }}>
        <span className="text-white font-bold text-2xl">A</span>
      </div>
      <p className="text-muted-foreground text-sm">Loading Aurzo…</p>
    </div>
  </div>
);

const SpinnerFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

// ── Protected route: requires auth ────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SpinnerFallback />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// ── Protected route: requires auth + completed onboarding ────────────────────
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: subLoading } = useSubscription();
  const location = useLocation();

  if (authLoading || subLoading) return <SpinnerFallback />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Light mode by default for AurzoMorning
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* ── Public routes ─────────────────────────────── */}
                <Route path="/" element={<AurzoLanding />} />
                <Route path="/login" element={<AurzoLogin />} />
                <Route path="/signup" element={<AurzoSignup />} />

                {/* ── Auth-only: onboarding (no onboarding check here) ── */}
                <Route
                  path="/onboarding"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<SpinnerFallback />}>
                        <AurzoOnboarding />
                      </Suspense>
                    </RequireAuth>
                  }
                />

                {/* ── Auth + onboarding: dashboard, plans ──────────── */}
                <Route
                  path="/dashboard"
                  element={
                    <RequireOnboarding>
                      <Suspense fallback={<SpinnerFallback />}>
                        <AurzoDashboard />
                      </Suspense>
                    </RequireOnboarding>
                  }
                />
                <Route
                  path="/plans"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<SpinnerFallback />}>
                        <AurzoPlans />
                      </Suspense>
                    </RequireAuth>
                  }
                />

                {/* ── AurzoMorning AI planner (requires auth) ──────── */}
                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<SpinnerFallback />}>
                        <AurzoHome />
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/tools"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<SpinnerFallback />}>
                        <AurzoTools />
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/tools/:toolId"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<SpinnerFallback />}>
                        <AurzoToolPage />
                      </Suspense>
                    </RequireAuth>
                  }
                />

                {/* ── Legacy quiz app routes ────────────────────────── */}
                <Route path="/legacy" element={<Index />} />
                <Route path="/legacy/login" element={<Login />} />
                <Route path="/legacy/signup" element={<Signup />} />
                <Route path="/legacy/dashboard" element={<Dashboard />} />
                <Route path="/legacy/overview" element={<Overview />} />
                <Route path="/admin" element={<Admin />} />

                {/* ── 404 ──────────────────────────────────────────── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
