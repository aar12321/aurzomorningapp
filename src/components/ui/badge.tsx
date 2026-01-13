import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface BadgeProps {
  icon: LucideIcon;
  name: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
  requirement?: string;
}

export const Badge = ({ 
  icon: Icon, 
  name, 
  description, 
  earned, 
  earnedAt,
  requirement 
}: BadgeProps) => {
  return (
    <motion.div
      className={`p-4 rounded-xl border-2 transition-all ${
        earned 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-border bg-muted/20'
      }`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          earned ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {earnedAt && (
            <p className="text-xs text-primary mt-1">Earned {earnedAt}</p>
          )}
          {requirement && !earned && (
            <p className="text-xs text-muted-foreground mt-1">{requirement}</p>
          )}
        </div>
        {earned && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-primary"
          >
            ✓
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};