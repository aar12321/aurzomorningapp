import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
    icon: LucideIcon;
    emoji?: string;
    name: string;
    description: string;
    isNew?: boolean;
    onClick?: () => void;
}

export function ToolCard({ icon: Icon, emoji, name, description, isNew, onClick }: ToolCardProps) {
    return (
        <div
            className="tool-card cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                    {emoji || <Icon className="w-6 h-6 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{name}</h3>
                        {isNew && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-primary text-white rounded-full shrink-0">
                                New
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
                </div>
            </div>
            <button className="mt-4 w-full py-2 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
                Use Tool
            </button>
        </div>
    );
}
