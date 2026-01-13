import { useState, useMemo } from 'react';
import { Search, Utensils, Briefcase, GraduationCap, DollarSign, Heart, Plane, Sun, Users } from 'lucide-react';
import { ToolCard, CategoryPills, TabNavigation } from '@/components/aurzo';
import { useNavigate } from 'react-router-dom';

interface Tool {
    id: string;
    name: string;
    description: string;
    emoji: string;
    category: string;
    isNew?: boolean;
}

export default function Tools() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = [
        'All',
        'Social',
        'Work',
        'School',
        'Money',
        'Health',
        'Travel',
        'Life',
    ];

    const tools: Tool[] = [
        // Social
        { id: 'restaurant-picker', name: 'Group Restaurant Picker', description: 'Find the perfect place for everyone', emoji: '🍽', category: 'Social', isNew: true },
        { id: 'split-bill', name: 'Split Bill Planner', description: 'Easily divide expenses with friends', emoji: '💵', category: 'Social' },
        { id: 'invite-generator', name: 'Invite Text Generator', description: 'Create perfect invites in seconds', emoji: '💬', category: 'Social' },
        { id: 'ride-coordinator', name: 'Ride Coordinator', description: 'Organize who\'s driving', emoji: '🚗', category: 'Social' },

        // Work
        { id: 'meeting-prep', name: 'Meeting Prep AI', description: 'Auto-generate agendas and notes', emoji: '📋', category: 'Work', isNew: true },
        { id: 'email-writer', name: 'Email Writer', description: 'Professional emails in seconds', emoji: '✉️', category: 'Work' },
        { id: 'task-prioritizer', name: 'Task Prioritizer', description: 'Focus on what matters most', emoji: '🎯', category: 'Work' },
        { id: 'presentation-helper', name: 'Presentation Helper', description: 'Build slides that impress', emoji: '📊', category: 'Work' },

        // School
        { id: 'study-coach', name: 'Study Coach', description: 'AI-powered exam preparation', emoji: '📚', category: 'School' },
        { id: 'essay-helper', name: 'Essay Helper', description: 'Structure and refine your writing', emoji: '📝', category: 'School' },
        { id: 'flashcard-maker', name: 'Flashcard Maker', description: 'Create study cards instantly', emoji: '🗂', category: 'School' },
        { id: 'deadline-tracker', name: 'Deadline Tracker', description: 'Never miss a due date', emoji: '⏰', category: 'School' },

        // Money
        { id: 'budget-planner', name: 'Budget Planner', description: 'Track spending effortlessly', emoji: '💰', category: 'Money' },
        { id: 'expense-splitter', name: 'Trip Expense Splitter', description: 'Who owes what, instantly', emoji: '🧮', category: 'Money' },
        { id: 'savings-goal', name: 'Savings Goal Setter', description: 'Reach your targets faster', emoji: '🎯', category: 'Money' },

        // Health
        { id: 'workout-planner', name: 'Workout Planner', description: 'Personalized fitness routines', emoji: '💪', category: 'Health' },
        { id: 'meal-planner', name: 'Meal Planner', description: 'Healthy eating made easy', emoji: '🥗', category: 'Health' },
        { id: 'sleep-optimizer', name: 'Sleep Optimizer', description: 'Better rest, better days', emoji: '😴', category: 'Health' },
        { id: 'meditation-timer', name: 'Meditation Timer', description: 'Find your calm', emoji: '🧘', category: 'Health' },

        // Travel
        { id: 'trip-planner', name: 'Trip Planner', description: 'Plan your perfect getaway', emoji: '✈️', category: 'Travel', isNew: true },
        { id: 'packing-list', name: 'Smart Packing List', description: 'Never forget anything', emoji: '🧳', category: 'Travel' },
        { id: 'itinerary-builder', name: 'Itinerary Builder', description: 'Maximize your trip', emoji: '🗺', category: 'Travel' },

        // Life
        { id: 'gift-finder', name: 'Gift Finder', description: 'Never guess again', emoji: '🎁', category: 'Life' },
        { id: 'date-idea', name: 'Date Idea Generator', description: 'Romantic plans made easy', emoji: '❤️', category: 'Life' },
        { id: 'morning-routine', name: 'Morning Routine Planner', description: 'Start your day right', emoji: '☀️', category: 'Life' },
        { id: 'decision-maker', name: 'Decision Maker', description: 'When you can\'t choose', emoji: '🎲', category: 'Life' },
    ];

    const filteredTools = useMemo(() => {
        let result = tools;

        if (activeCategory !== 'All') {
            result = result.filter(tool => tool.category === activeCategory);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(tool =>
                tool.name.toLowerCase().includes(query) ||
                tool.description.toLowerCase().includes(query) ||
                tool.category.toLowerCase().includes(query)
            );
        }

        return result;
    }, [tools, activeCategory, searchQuery]);

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-6 pt-6 pb-4 safe-top">
                <h1 className="text-2xl font-bold text-foreground mb-4">Tools</h1>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="What do you need help with?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input pl-12"
                    />
                </div>

                {/* Categories */}
                <div className="mt-4">
                    <CategoryPills
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelect={setActiveCategory}
                    />
                </div>
            </header>

            {/* Tools Grid */}
            <main className="px-6 py-4">
                {filteredTools.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredTools.map((tool) => (
                            <ToolCard
                                key={tool.id}
                                icon={Search}
                                emoji={tool.emoji}
                                name={tool.name}
                                description={tool.description}
                                isNew={tool.isNew}
                                onClick={() => navigate(`/app/tools/${tool.id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No tools found
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            Try a different search or category
                        </p>
                    </div>
                )}
            </main>

            {/* Tab Navigation */}
            <TabNavigation />
        </div>
    );
}
