import { Toaster } from "@/components/ui/toaster";
import { useEffect, lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Aurzo Pages (New)
const AurzoLanding = lazy(() => import("./pages/aurzo/Landing"));
const AurzoLogin = lazy(() => import("./pages/aurzo/Login"));
const AurzoHome = lazy(() => import("./pages/aurzo/Home"));
const AurzoTools = lazy(() => import("./pages/aurzo/Tools"));
const AurzoToolPage = lazy(() => import("./pages/aurzo/ToolPage"));

// Legacy Pages (keeping for backward compatibility)
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Overview = lazy(() => import("./pages/Overview"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
        <span className="text-white font-bold text-2xl">A</span>
      </div>
      <p className="text-muted-foreground text-sm">Loading AurzoMorning...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Set light mode by default for AurzoMorning
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
                {/* AurzoMorning Routes */}
                <Route path="/" element={<AurzoLanding />} />
                <Route path="/login" element={<AurzoLogin />} />

                {/* Logged-in App Routes */}
                <Route path="/app" element={<AurzoHome />} />
                <Route path="/app/tools" element={<AurzoTools />} />
                <Route path="/app/tools/:toolId" element={<AurzoToolPage />} />

                {/* Legacy Routes (redirect or keep for compatibility) */}
                <Route path="/legacy" element={<Index />} />
                <Route path="/legacy/login" element={<Login />} />
                <Route path="/legacy/signup" element={<Signup />} />
                <Route path="/legacy/dashboard" element={<Dashboard />} />
                <Route path="/legacy/overview" element={<Overview />} />
                <Route path="/admin" element={<Admin />} />

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
