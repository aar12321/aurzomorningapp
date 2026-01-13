import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap, Calendar } from 'lucide-react';

interface ToolConfig {
    name: string;
    emoji: string;
    description: string;
    explanation: string;
    inputs: {
        id: string;
        label: string;
        type: 'text' | 'number' | 'select' | 'textarea' | 'toggle';
        placeholder?: string;
        options?: string[];
    }[];
}

const toolConfigs: Record<string, ToolConfig> = {
    'restaurant-picker': {
        name: 'Group Restaurant Picker',
        emoji: '🍽',
        description: 'Find the perfect place for everyone',
        explanation: 'Tell us about your group and preferences, and we\'ll find restaurants that work for everyone\'s tastes and dietary needs.',
        inputs: [
            { id: 'location', label: 'Location', type: 'text', placeholder: 'e.g., Downtown Manhattan' },
            { id: 'groupSize', label: 'Group Size', type: 'number', placeholder: '4' },
            { id: 'cuisine', label: 'Cuisine Preference', type: 'select', options: ['Any', 'Italian', 'Japanese', 'Mexican', 'Indian', 'American', 'Chinese', 'Thai', 'Mediterranean'] },
            { id: 'budget', label: 'Budget per Person', type: 'select', options: ['$10-20', '$20-40', '$40-70', '$70+'] },
            { id: 'dietary', label: 'Dietary Restrictions', type: 'text', placeholder: 'e.g., vegetarian, gluten-free' },
        ],
    },
    'meeting-prep': {
        name: 'Meeting Prep AI',
        emoji: '📋',
        description: 'Auto-generate agendas and notes',
        explanation: 'Enter your meeting details and we\'ll create a professional agenda with talking points, time allocations, and follow-up items.',
        inputs: [
            { id: 'topic', label: 'Meeting Topic', type: 'text', placeholder: 'e.g., Q1 Planning Session' },
            { id: 'duration', label: 'Duration (minutes)', type: 'number', placeholder: '60' },
            { id: 'attendees', label: 'Attendees', type: 'textarea', placeholder: 'List attendee names...' },
            { id: 'goals', label: 'Meeting Goals', type: 'textarea', placeholder: 'What do you want to accomplish?' },
        ],
    },
    'gift-finder': {
        name: 'Gift Finder',
        emoji: '🎁',
        description: 'Never guess again',
        explanation: 'Tell us about the recipient and occasion, and we\'ll suggest thoughtful gift ideas they\'ll actually love.',
        inputs: [
            { id: 'recipient', label: 'Who is this for?', type: 'text', placeholder: 'e.g., Mom, Best Friend, Colleague' },
            { id: 'occasion', label: 'Occasion', type: 'select', options: ['Birthday', 'Holiday', 'Anniversary', 'Graduation', 'Thank You', 'Just Because'] },
            { id: 'interests', label: 'Their Interests', type: 'textarea', placeholder: 'e.g., cooking, hiking, reading...' },
            { id: 'budget', label: 'Budget', type: 'select', options: ['Under $25', '$25-50', '$50-100', '$100-200', '$200+'] },
        ],
    },
    'trip-planner': {
        name: 'Trip Planner',
        emoji: '✈️',
        description: 'Plan your perfect getaway',
        explanation: 'Share your destination and preferences, and we\'ll create a personalized itinerary with must-see spots and hidden gems.',
        inputs: [
            { id: 'destination', label: 'Destination', type: 'text', placeholder: 'e.g., Tokyo, Japan' },
            { id: 'duration', label: 'Trip Duration (days)', type: 'number', placeholder: '7' },
            { id: 'style', label: 'Travel Style', type: 'select', options: ['Adventure', 'Relaxation', 'Culture', 'Foodie', 'Budget', 'Luxury'] },
            { id: 'interests', label: 'Interests', type: 'textarea', placeholder: 'e.g., museums, local food, nature...' },
        ],
    },
    'split-bill': {
        name: 'Split Bill Planner',
        emoji: '💵',
        description: 'Easily divide expenses with friends',
        explanation: 'Enter your bill details and we\'ll calculate exactly who owes what, including tip and tax.',
        inputs: [
            { id: 'total', label: 'Total Bill Amount', type: 'number', placeholder: '120.00' },
            { id: 'people', label: 'Number of People', type: 'number', placeholder: '4' },
            { id: 'tip', label: 'Tip Percentage', type: 'select', options: ['15%', '18%', '20%', '22%', '25%', 'Custom'] },
        ],
    },
};

export default function ToolPage() {
    const navigate = useNavigate();
    const { toolId } = useParams<{ toolId: string }>();
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const tool = toolConfigs[toolId || ''];

    if (!tool) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Tool not found</p>
                    <button onClick={() => navigate('/app/tools')} className="btn-primary">
                        Back to Tools
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async () => {
        setIsLoading(true);
        // TODO: Implement actual AI tool execution
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
        // Navigate to results or show inline
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-6 py-4 safe-top border-b border-border">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{tool.emoji}</span>
                        <h1 className="text-xl font-bold text-foreground">{tool.name}</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="px-6 py-6">
                {/* Explanation */}
                <p className="text-muted-foreground mb-8">
                    {tool.explanation}
                </p>

                {/* Form */}
                <div className="space-y-5">
                    {tool.inputs.map((input) => (
                        <div key={input.id}>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                {input.label}
                            </label>
                            {input.type === 'select' ? (
                                <select
                                    value={formData[input.id] || ''}
                                    onChange={(e) => setFormData({ ...formData, [input.id]: e.target.value })}
                                    className="search-input"
                                >
                                    <option value="">Select...</option>
                                    {input.options?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : input.type === 'textarea' ? (
                                <textarea
                                    value={formData[input.id] || ''}
                                    onChange={(e) => setFormData({ ...formData, [input.id]: e.target.value })}
                                    placeholder={input.placeholder}
                                    rows={3}
                                    className="search-input resize-none"
                                />
                            ) : (
                                <input
                                    type={input.type}
                                    value={formData[input.id] || ''}
                                    onChange={(e) => setFormData({ ...formData, [input.id]: e.target.value })}
                                    placeholder={input.placeholder}
                                    className="search-input"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </main>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 inset-x-0 p-6 bg-background/95 backdrop-blur-xl border-t border-border safe-bottom">
                <div className="flex gap-3">
                    <button
                        className="btn-secondary flex-1"
                        onClick={() => {/* Link to current calendar event */ }}
                    >
                        <Calendar className="w-5 h-5" />
                        Use for Event
                    </button>
                    <button
                        className="btn-primary flex-1"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="animate-pulse-soft">Running...</span>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                Run Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
