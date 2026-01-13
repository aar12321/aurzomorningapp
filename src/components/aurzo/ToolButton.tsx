interface ToolButtonProps {
    emoji: string;
    label: string;
    onClick?: () => void;
}

export function ToolButton({ emoji, label, onClick }: ToolButtonProps) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary hover:bg-muted transition-all active:scale-95"
        >
            <span className="text-3xl">{emoji}</span>
            <span className="text-xs font-medium text-foreground text-center">{label}</span>
        </button>
    );
}
