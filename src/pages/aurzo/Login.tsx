import { useNavigate } from 'react-router-dom';
import { Calendar, Shield } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();

    const handleGoogleSignIn = () => {
        // TODO: Implement actual Google OAuth with Calendar permissions
        // For now, simulate login and redirect to app
        navigate('/app');
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-accent/10 items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8">
                        <span className="text-white font-bold text-4xl">A</span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        AurzoMorning
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Your entire day, powered by AI.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-12">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-2xl">A</span>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">AurzoMorning</h1>
                    </div>

                    <div className="aurzo-card p-8">
                        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-muted-foreground text-center mb-8">
                            Sign in to access your AI-powered day
                        </p>

                        {/* Google Sign In Button */}
                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Privacy Note */}
                        <div className="flex items-start gap-3 mt-6 p-4 rounded-xl bg-secondary">
                            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                                We only read your calendar to understand your day. We never modify, share, or store your personal information.
                            </p>
                        </div>
                    </div>

                    {/* Back to Home */}
                    <button
                        onClick={() => navigate('/')}
                        className="w-full mt-6 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
