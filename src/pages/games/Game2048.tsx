import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const GRID_SIZE = 4;

const getEmptyBoard = () => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));

const generateRandomTile = (board: number[][]) => {
    const emptyCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === 0) emptyCells.push({ r, c });
        }
    }
    if (emptyCells.length === 0) return board;

    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
};

const moveLeft = (board: number[][]) => {
    const newBoard = getEmptyBoard();
    let score = 0;

    for (let r = 0; r < GRID_SIZE; r++) {
        let newRow = board[r].filter(val => val !== 0);
        for (let c = 0; c < newRow.length - 1; c++) {
            if (newRow[c] === newRow[c + 1]) {
                newRow[c] *= 2;
                score += newRow[c];
                newRow.splice(c + 1, 1);
            }
        }
        while (newRow.length < GRID_SIZE) newRow.push(0);
        newBoard[r] = newRow;
    }
    return { board: newBoard, score };
};

const rotateBoard = (board: number[][]) => {
    const newBoard = getEmptyBoard();
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            newBoard[c][GRID_SIZE - 1 - r] = board[r][c];
        }
    }
    return newBoard;
};

const moveRight = (board: number[][]) => {
    let rotated = rotateBoard(rotateBoard(board));
    let { board: moved, score } = moveLeft(rotated);
    return { board: rotateBoard(rotateBoard(moved)), score };
};

const moveUp = (board: number[][]) => {
    let rotated = rotateBoard(rotateBoard(rotateBoard(board)));
    let { board: moved, score } = moveLeft(rotated);
    return { board: rotateBoard(moved), score };
};

const moveDown = (board: number[][]) => {
    let rotated = rotateBoard(board);
    let { board: moved, score } = moveLeft(rotated);
    return { board: rotateBoard(rotateBoard(rotateBoard(moved))), score };
};

const Game2048 = () => {
    const navigate = useNavigate();
    const [board, setBoard] = useState<number[][]>(getEmptyBoard());
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        initGame();
    }, []);

    const initGame = () => {
        let newBoard = getEmptyBoard();
        newBoard = generateRandomTile(newBoard);
        newBoard = generateRandomTile(newBoard);
        setBoard(newBoard);
        setScore(0);
        setGameOver(false);
    };

    const handleMove = useCallback((direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
        if (gameOver) return;

        let result;
        switch (direction) {
            case "UP": result = moveUp(board); break;
            case "DOWN": result = moveDown(board); break;
            case "LEFT": result = moveLeft(board); break;
            case "RIGHT": result = moveRight(board); break;
        }

        if (JSON.stringify(result.board) !== JSON.stringify(board)) {
            const newBoard = generateRandomTile(result.board);
            setBoard(newBoard);
            setScore(prev => prev + result.score);

            const hasEmpty = newBoard.some(row => row.some(cell => cell === 0));
            if (!hasEmpty) {
                let canMerge = false;
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        if (r < GRID_SIZE - 1 && newBoard[r][c] === newBoard[r + 1][c]) canMerge = true;
                        if (c < GRID_SIZE - 1 && newBoard[r][c] === newBoard[r][c + 1]) canMerge = true;
                    }
                }
                if (!canMerge) {
                    setGameOver(true);
                    saveGameScore("2048", score + result.score, { board: newBoard });
                }
            }
        }
    }, [board, gameOver]);

    const saveGameScore = async (gameType: string, score: number, metadata: any) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: user } = await supabase
                .from("users")
                .select("id")
                .eq("auth_id", session.user.id)
                .single();

            if (!user) return;

            await supabase.from("game_scores").insert({
                user_id: user.id,
                game_type: gameType,
                score: score,
                metadata: metadata
            });
        } catch (error) {
            console.error("Error saving score:", error);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp") { e.preventDefault(); handleMove("UP"); }
            if (e.key === "ArrowDown") { e.preventDefault(); handleMove("DOWN"); }
            if (e.key === "ArrowLeft") { e.preventDefault(); handleMove("LEFT"); }
            if (e.key === "ArrowRight") { e.preventDefault(); handleMove("RIGHT"); }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleMove]);

    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const dx = touchEnd.x - touchStart.x;
        const dy = touchEnd.y - touchStart.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 30) {
                if (dx > 0) handleMove("RIGHT");
                else handleMove("LEFT");
            }
        } else {
            if (Math.abs(dy) > 30) {
                if (dy > 0) handleMove("DOWN");
                else handleMove("UP");
            }
        }
        setTouchStart(null);
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-background text-foreground">
            <div className="w-full max-w-md flex items-center justify-between mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate("/games")} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-2xl font-bold text-foreground">2048</h1>
                <div className="w-10" />
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-md">
                <div className="flex items-center justify-between w-full">
                    <div className="bg-muted px-4 py-2 rounded-xl border border-border">
                        <div className="text-xs text-muted-foreground uppercase font-bold">Score</div>
                        <div className="text-xl font-bold text-foreground">{score}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={initGame} className="text-muted-foreground hover:text-foreground">
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                </div>

                <div
                    className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border-2 border-border shadow-lg touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="grid grid-cols-4 gap-3">
                        {board.map((row, r) => (
                            row.map((val, c) => (
                                <div
                                    key={`${r}-${c}`}
                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-200 border-2 ${
                                        val === 0 ? "bg-muted/60 border-border/50" :
                                        val === 2 ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800" :
                                        val === 4 ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-800/40 dark:text-amber-50 dark:border-amber-700" :
                                        val === 8 ? "bg-amber-200 text-amber-900 border-amber-400 dark:bg-amber-700/50 dark:text-amber-50 dark:border-amber-600" :
                                        val === 16 ? "bg-orange-300 text-orange-900 border-orange-400 dark:bg-orange-800/50 dark:text-orange-50 dark:border-orange-700" :
                                        val === 32 ? "bg-orange-400 text-white border-orange-500 dark:bg-orange-700/60 dark:border-orange-600 shadow-md" :
                                        val === 64 ? "bg-orange-500 text-white border-orange-600 dark:bg-orange-600/70 dark:border-orange-500 shadow-lg" :
                                        val >= 128 ? "bg-yellow-400 text-yellow-900 border-yellow-500 dark:bg-yellow-500/80 dark:text-yellow-50 dark:border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]" :
                                        "bg-muted border-border"
                                    }`}
                                >
                                    {val > 0 && val}
                                </div>
                            ))
                        ))}
                    </div>
                </div>

                {gameOver && (
                    <div className="text-center space-y-4 p-6 bg-card backdrop-blur-md rounded-2xl border border-border w-full">
                        <h3 className="text-xl font-bold text-foreground">Game Over!</h3>
                        <Button onClick={initGame} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            Try Again
                        </Button>
                    </div>
                )}

                <div className="text-sm text-muted-foreground text-center max-w-xs">
                    Use arrow keys or swipe to move tiles. Merge same numbers to reach 2048!
                </div>
            </div>
        </div>
    );
};

export default Game2048;
