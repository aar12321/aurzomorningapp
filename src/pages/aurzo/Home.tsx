import { useState } from 'react';
import { Cloud, Sun, ChevronDown, MapPin } from 'lucide-react';
import { EventCard, BottomSheet, ToolButton, CalendarEvent } from '@/components/aurzo';
import { TabNavigation } from '@/components/aurzo/TabNavigation';

export default function Home() {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Mock user data
    const userName = 'Aaryan';
    const currentDate = new Date();
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    // Mock weather
    const weather = { temp: 45, condition: 'Partly Cloudy' };

    // Mock time
    const currentTime = currentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Mock calendar events
    const events: CalendarEvent[] = [
        {
            id: '1',
            title: 'Team Stand-up',
            startTime: '9:00 AM',
            endTime: '9:30 AM',
            attendees: 5,
            color: 'blue',
        },
        {
            id: '2',
            title: 'Lunch with Friends',
            startTime: '12:30 PM',
            endTime: '1:30 PM',
            location: 'Uptown Cafe',
            attendees: 4,
            color: 'green',
        },
        {
            id: '3',
            title: 'Gym',
            startTime: '3:00 PM',
            endTime: '4:00 PM',
            location: 'Fitness First',
            color: 'orange',
        },
        {
            id: '4',
            title: 'Date Night',
            startTime: '7:00 PM',
            endTime: '9:00 PM',
            location: 'Downtown',
            color: 'pink',
        },
    ];

    // Tool suggestions based on event type
    const getToolsForEvent = (event: CalendarEvent) => {
        const toolSets: Record<string, { emoji: string; label: string }[]> = {
            'Team Stand-up': [
                { emoji: '📋', label: 'Agenda' },
                { emoji: '📝', label: 'Notes' },
                { emoji: '⏰', label: 'Timer' },
                { emoji: '📊', label: 'Summary' },
            ],
            'Lunch with Friends': [
                { emoji: '🍔', label: 'Restaurant' },
                { emoji: '🚗', label: 'Rides' },
                { emoji: '💬', label: 'Message' },
                { emoji: '💵', label: 'Split Bill' },
                { emoji: '📍', label: 'Parking' },
                { emoji: '⏰', label: 'ETA' },
            ],
            'Gym': [
                { emoji: '💪', label: 'Workout' },
                { emoji: '🎵', label: 'Playlist' },
                { emoji: '📊', label: 'Progress' },
                { emoji: '🥤', label: 'Nutrition' },
            ],
            'Date Night': [
                { emoji: '🍽', label: 'Restaurant' },
                { emoji: '🎬', label: 'Movies' },
                { emoji: '🎁', label: 'Gift' },
                { emoji: '💬', label: 'Ideas' },
                { emoji: '🚗', label: 'Rides' },
                { emoji: '📍', label: 'Venue' },
            ],
        };
        return toolSets[event.title] || [
            { emoji: '📋', label: 'Prep' },
            { emoji: '📝', label: 'Notes' },
            { emoji: '⏰', label: 'Remind' },
            { emoji: '💬', label: 'Message' },
        ];
    };

    const getGreeting = () => {
        const hour = currentDate.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Top Bar */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-6 pt-6 pb-4 safe-top">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {getGreeting()}, {userName}
                        </h1>
                    </div>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground">
                        Today
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>

                {/* Weather & Time Strip */}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>{weather.temp}°F · {weather.condition}</span>
                    </div>
                    <span>·</span>
                    <span>{dayName}, {monthDay}</span>
                    <span>·</span>
                    <span>{currentTime}</span>
                </div>
            </header>

            {/* Timeline */}
            <main className="px-6 py-4">
                <div className="space-y-3">
                    {events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onClick={() => setSelectedEvent(event)}
                        />
                    ))}
                </div>

                {/* Empty State (when no events) */}
                {events.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                            <Sun className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            Your day is clear!
                        </h3>
                        <p className="text-muted-foreground max-w-xs">
                            No events scheduled. Enjoy the free time or explore our AI tools.
                        </p>
                    </div>
                )}
            </main>

            {/* Event Bottom Sheet */}
            <BottomSheet
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                title={selectedEvent?.title}
                subtitle={selectedEvent ? `${selectedEvent.startTime} · ${selectedEvent.attendees || 1} ${(selectedEvent.attendees || 1) > 1 ? 'people' : 'person'}` : ''}
            >
                {selectedEvent && (
                    <>
                        {/* Location if available */}
                        {selectedEvent.location && (
                            <div className="flex items-center gap-2 mb-5 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{selectedEvent.location}</span>
                            </div>
                        )}

                        {/* Tools Section */}
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                                Here's how Aurzo can help
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {getToolsForEvent(selectedEvent).map((tool) => (
                                    <ToolButton
                                        key={tool.label}
                                        emoji={tool.emoji}
                                        label={tool.label}
                                        onClick={() => {
                                            // TODO: Navigate to tool with event context
                                            console.log(`Open ${tool.label} for ${selectedEvent.title}`);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </BottomSheet>

            {/* Tab Navigation */}
            <TabNavigation />
        </div>
    );
}
