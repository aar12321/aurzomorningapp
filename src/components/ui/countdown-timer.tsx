import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { getTimeUntilNextUnlock, formatCountdown } from "@/lib/streak-manager";

interface CountdownTimerProps {
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "compact" | "detailed";
}

export const CountdownTimer = ({ 
  className = "", 
  showIcon = true, 
  variant = "default" 
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const time = getTimeUntilNextUnlock();
      setTimeLeft(time);
    };

    // Update immediately
    updateCountdown();

    // Update every minute
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, []);

  const countdownText = formatCountdown(timeLeft.hours, timeLeft.minutes);

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1 text-sm ${className}`}>
        {showIcon && <Clock className="w-4 h-4" />}
        <span className="font-mono">{countdownText}</span>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`text-center ${className}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          {showIcon && <Clock className="w-6 h-6 text-primary" />}
          <span className="text-2xl font-bold text-foreground">{countdownText}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          until next day unlocks
        </p>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Clock className="w-5 h-5 text-primary" />}
      <span className="font-mono font-semibold">{countdownText}</span>
    </div>
  );
};
