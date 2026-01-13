import { motion } from "framer-motion";
import { Brain, Target, Zap, Trophy, Sparkles, Clock } from "lucide-react";

const features = [
    {
        icon: <Brain className="w-6 h-6 text-purple-400" />,
        title: "Smart Daily Quizzes",
        description: "AI-curated questions that adapt to your learning pace and interests.",
        gradient: "from-purple-500/20 to-blue-500/20"
    },
    {
        icon: <Target className="w-6 h-6 text-blue-400" />,
        title: "Diverse Topics",
        description: "Choose from 36+ subjects ranging from Science to History and Tech.",
        gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
        icon: <Trophy className="w-6 h-6 text-yellow-400" />,
        title: "Gamified Growth",
        description: "Earn XP, build streaks, and climb the leaderboard as you learn.",
        gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
        icon: <Clock className="w-6 h-6 text-pink-400" />,
        title: "Morning Routine",
        description: "Designed to be completed in just 2 minutes every morning.",
        gradient: "from-pink-500/20 to-rose-500/20"
    },
    {
        icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
        title: "Instant Feedback",
        description: "Get detailed explanations for every answer to deepen your understanding.",
        gradient: "from-cyan-500/20 to-teal-500/20"
    },
    {
        icon: <Zap className="w-6 h-6 text-orange-400" />,
        title: "Fast Progress",
        description: "Track your improvement over time with detailed analytics.",
        gradient: "from-orange-500/20 to-red-500/20"
    }
];

export const Features = () => {
    return (
        <section className="py-24 relative z-10">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 space-y-4"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                        Why Morning Loop?
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Transform your mornings with a learning habit that sticks.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.02, translateY: -5 }}
                            className={`p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
