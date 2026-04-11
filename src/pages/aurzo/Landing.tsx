import { ArrowRight, Play, Calendar, Brain, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
    const navigate = useNavigate();

    const howItWorksSteps = [
        {
            icon: '📅',
            title: 'Sync',
            description: 'Connect your Google Calendar in one click',
        },
        {
            icon: '🧠',
            title: 'Understand',
            description: 'We analyze your events and context',
        },
        {
            icon: '🔗',
            title: 'Attach',
            description: 'AI tools attach to each moment',
        },
        {
            icon: '⚡',
            title: 'Execute',
            description: 'Tap and go. No searching, just action',
        },
    ];

    const mondayDrops = [
        { emoji: '🍽', name: 'Group Dinner Picker', description: 'Find the perfect place for everyone' },
        { emoji: '📋', name: 'Meeting Agenda Generator', description: 'Auto-generate agendas and notes' },
        { emoji: '🎁', name: 'Gift Finder', description: 'Never guess again' },
        { emoji: '✈️', name: 'Trip Planner', description: 'Plan your perfect getaway' },
        { emoji: '📚', name: 'Study Coach', description: 'AI-powered exam prep' },
        { emoji: '💪', name: 'Workout Planner', description: 'Personalized fitness routines' },
    ];

    const comparison = [
        { old: 'You search for tools', new: 'Tools find you' },
        { old: 'You manage tasks', new: 'Tasks manage themselves' },
        { old: 'You open 5 apps', new: 'One screen' },
        { old: 'You plan manually', new: 'AI runs your day' },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Top Bar */}
            <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <span className="font-bold text-xl text-foreground">AurzoMorning</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Log in
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn-primary text-sm !px-4 !py-2"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="min-h-screen flex items-center justify-center pt-20 px-6">
                <div className="max-w-4xl mx-auto text-center animate-slide-up">
                    <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6">
                        Your entire day,{' '}
                        <span className="gradient-text">powered by AI.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        We connect to your calendar and give you AI tools for every task, meeting, and decision.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn-primary text-lg"
                        >
                            <Calendar className="w-5 h-5" />
                            Get Started Free
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-secondary text-lg"
                        >
                            <Play className="w-5 h-5" />
                            Sign In
                        </button>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-6 bg-secondary/50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
                        How It Works
                    </h2>
                    <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                        From calendar to action in 4 simple steps
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {howItWorksSteps.map((step, index) => (
                            <div
                                key={step.title}
                                className="aurzo-card p-8 text-center relative"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {index < howItWorksSteps.length - 1 && (
                                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                                )}
                                <div className="text-5xl mb-4">{step.icon}</div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Monday Drops */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Zap className="w-8 h-8 text-primary" />
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                            Monday Drops
                        </h2>
                    </div>
                    <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                        Every Monday, you get a new AI power-up. Like Netflix, but for life tools.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mondayDrops.map((tool, index) => (
                            <div
                                key={tool.name}
                                className="aurzo-card p-6 flex items-start gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                                    {tool.emoji}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-foreground">{tool.name}</h3>
                                        {index === 0 && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-primary text-white rounded-full">
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Different */}
            <section className="py-24 px-6 bg-secondary/50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
                        Why Aurzo is Different
                    </h2>
                    <p className="text-lg text-muted-foreground text-center mb-16">
                        We're not another productivity app. We're an AI layer on your life.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted/50">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                                Normal Apps
                            </h4>
                            {comparison.map((item) => (
                                <div key={item.old} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                                    <span className="text-muted-foreground">{item.old}</span>
                                </div>
                            ))}
                        </div>
                        <div className="aurzo-card p-4">
                            <h4 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wide">
                                AurzoMorning
                            </h4>
                            {comparison.map((item) => (
                                <div key={item.new} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                                    <span className="font-medium text-foreground">{item.new}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <Brain className="w-16 h-16 text-primary mx-auto mb-6" />
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                        Turn your calendar into an AI assistant.
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                        Join thousands who've made their days smarter with Aurzo.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn-primary text-lg"
                    >
                        Start Free
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-border">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-white font-bold text-xs">A</span>
                        </div>
                        <span className="font-semibold text-foreground">AurzoMorning</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © 2026 AurzoMorning. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
