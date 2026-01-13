import { MapPin, Clock, Users } from 'lucide-react';

export interface CalendarEvent {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    attendees?: number;
    color?: string;
}

interface EventCardProps {
    event: CalendarEvent;
    onClick?: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
    const gradientColors: Record<string, string> = {
        blue: 'from-blue-500/10 to-blue-600/5',
        green: 'from-green-500/10 to-green-600/5',
        orange: 'from-orange-500/10 to-orange-600/5',
        purple: 'from-purple-500/10 to-purple-600/5',
        pink: 'from-pink-500/10 to-pink-600/5',
        default: 'from-primary/10 to-primary/5',
    };

    const gradient = gradientColors[event.color || 'default'] || gradientColors.default;

    return (
        <div
            className={`event-card bg-gradient-to-br ${gradient}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground truncate">{event.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{event.startTime} – {event.endTime}</span>
                        </div>
                        {event.attendees && (
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span>{event.attendees}</span>
                            </div>
                        )}
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                </div>
                <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border shrink-0">
                    <span className="text-xs font-medium text-muted-foreground">
                        {event.startTime.split(':')[0]}
                    </span>
                </div>
            </div>
        </div>
    );
}
