import { motion } from "framer-motion";
import { Gamepad2, Timer, Zap, BrainCircuit, Play, Grid3X3, Type } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const games = [
    {
        icon: <Zap className="w-5 h-5 text-yellow-400" />,
        title: "Word Guess",
        tag: "Daily Challenge",
        subtext: "Guess the 5-letter word.",
        color: "from-yellow-500/20 to-orange-500/20",
        borderColor: "border-yellow-500/20",
        link: "/games/wordle"
    },
    {
        icon: <Grid3X3 className="w-5 h-5 text-blue-400" />,
        title: "Sudoku",
        tag: "Logic",
        subtext: "Classic number puzzle.",
        color: "from-blue-500/20 to-cyan-500/20",
        borderColor: "border-blue-500/20",
        link: "/games/sudoku"
    },
    {
        icon: <BrainCircuit className="w-5 h-5 text-pink-400" />,
        title: "2048",
        tag: "Strategy",
        subtext: "Join the numbers to reach 2048.",
        color: "from-pink-500/20 to-purple-500/20",
        borderColor: "border-pink-500/20",
        link: "/games/2048"
    },
    {
        icon: <Type className="w-5 h-5 text-green-400" />,
        title: "Descramble",
        tag: "Word Game",
        subtext: "Unscramble the letters.",
        color: "from-green-500/20 to-emerald-500/20",
        borderColor: "border-green-500/20",
        link: "/games/descramble"
    }
];

export const GamesSection = () => {
    return (
        <section className="py-8 px-4 w-full max-w-md mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <Gamepad2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Today's Games</h2>
                        <p className="text-xs text-muted-foreground">Quick brain exercises</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {games.map((game, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Link to={game.link} target="_blank" rel="noopener noreferrer">
                                <Card className={`bg-gradient-to-r ${game.color} backdrop-blur-md border ${game.borderColor} overflow-hidden cursor-pointer group`}>
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-background/50 rounded-lg">
                                                {game.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-foreground">{game.title}</h3>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/50 text-muted-foreground border border-border/50">
                                                        {game.tag}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{game.subtext}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center group-hover:bg-background/80 transition-colors">
                                            <Play className="w-4 h-4 text-primary fill-current" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
};
