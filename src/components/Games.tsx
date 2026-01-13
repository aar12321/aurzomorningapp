import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, Calculator, Shuffle, BrainCircuit } from "lucide-react";

const Games = () => {
    const navigate = useNavigate();

    const games = [
        {
            id: "wordle",
            title: "Word Guess",
            description: "Guess the 5-letter word in 6 tries.",
            icon: <Grid3X3 className="w-8 h-8 text-green-400" />,
            route: "/games/wordle",
            color: "from-green-500/20 to-emerald-500/20"
        },
        {
            id: "2048",
            title: "2048",
            description: "Merge tiles to reach 2048!",
            icon: <Calculator className="w-8 h-8 text-amber-400" />,
            route: "/games/2048",
            color: "from-amber-500/20 to-orange-500/20"
        },
        {
            id: "sudoku",
            title: "Sudoku",
            description: "Classic number puzzle game.",
            icon: <BrainCircuit className="w-8 h-8 text-blue-400" />,
            route: "/games/sudoku",
            color: "from-blue-500/20 to-cyan-500/20"
        },
        {
            id: "descramble",
            title: "Word Descramble",
            description: "Unscramble letters to form words.",
            icon: <Shuffle className="w-8 h-8 text-purple-400" />,
            route: "/games/descramble",
            color: "from-purple-500/20 to-pink-500/20"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map((game) => (
                    <Card
                        key={game.id}
                        className={`p-6 bg-gradient-to-br ${game.color} backdrop-blur-md border border-border/50 hover:border-border shadow-lg hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden`}
                        onClick={() => navigate(game.route)}
                    >
                        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 group-hover:bg-black/10 transition-colors" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div className="space-y-2">
                                <div className="p-3 bg-background/50 rounded-xl w-fit backdrop-blur-sm">
                                    {game.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground group-hover:text-foreground/90 transition-colors">
                                        {game.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {game.description}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="text-muted-foreground group-hover:text-foreground group-hover:bg-background/20 transition-all"
                            >
                                Play
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Games;
