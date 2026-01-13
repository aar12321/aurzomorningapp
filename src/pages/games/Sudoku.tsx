import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Eraser, Clock, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

type Difficulty = 'easy' | 'medium' | 'hard';
type InputMode = 'number' | 'note';

const Sudoku = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [board, setBoard] = useState<number[][]>([]);
    const [notes, setNotes] = useState<Set<string>[][]>([]); // notes[r][c] = Set of numbers
    const [initialBoard, setInitialBoard] = useState<number[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);
    const [inputMode, setInputMode] = useState<InputMode>('number');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isSolved, setIsSolved] = useState(false);
    const [conflicts, setConflicts] = useState<Set<string>>(new Set()); // "r-c" format
    const [hintsUsed, setHintsUsed] = useState(0);

    // Initialize notes grid
    useEffect(() => {
        if (board.length > 0 && notes.length === 0) {
            setNotes(Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set<number>())));
        }
    }, [board, notes.length]);

    useEffect(() => {
        initGame();
    }, [difficulty]);

    useEffect(() => {
        if (isSolved || isPaused) return;
        
        const timer = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isSolved, isPaused]);

    // Keyboard support
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (isSolved) return;
            
            if (selectedCell) {
                if (e.key >= '1' && e.key <= '9') {
                    handleNumberInput(parseInt(e.key));
                } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                    handleErase();
                } else if (e.key === 'ArrowUp' && selectedCell.r > 0) {
                    setSelectedCell({ r: selectedCell.r - 1, c: selectedCell.c });
                } else if (e.key === 'ArrowDown' && selectedCell.r < 8) {
                    setSelectedCell({ r: selectedCell.r + 1, c: selectedCell.c });
                } else if (e.key === 'ArrowLeft' && selectedCell.c > 0) {
                    setSelectedCell({ r: selectedCell.r, c: selectedCell.c - 1 });
                } else if (e.key === 'ArrowRight' && selectedCell.c < 8) {
                    setSelectedCell({ r: selectedCell.r, c: selectedCell.c + 1 });
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectedCell, isSolved, inputMode]);

    // Check for conflicts whenever board changes
    useEffect(() => {
        if (board.length === 0) return;
        checkConflicts();
    }, [board]);

    const generateSolvedBoard = (): number[][] => {
        // Generate a valid solved Sudoku board
        const newBoard: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
        
        const isValid = (r: number, c: number, num: number): boolean => {
            // Check row
            for (let col = 0; col < 9; col++) {
                if (newBoard[r][col] === num) return false;
            }
            // Check column
            for (let row = 0; row < 9; row++) {
                if (newBoard[row][c] === num) return false;
            }
            // Check 3x3 box
            const boxRow = Math.floor(r / 3) * 3;
            const boxCol = Math.floor(c / 3) * 3;
            for (let row = boxRow; row < boxRow + 3; row++) {
                for (let col = boxCol; col < boxCol + 3; col++) {
                    if (newBoard[row][col] === num) return false;
                }
            }
            return true;
        };

        const solve = (r: number, c: number): boolean => {
            if (r === 9) return true;
            if (c === 9) return solve(r + 1, 0);
            if (newBoard[r][c] !== 0) return solve(r, c + 1);

            const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            // Shuffle for variety
            for (let i = nums.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [nums[i], nums[j]] = [nums[j], nums[i]];
            }

            for (const num of nums) {
                if (isValid(r, c, num)) {
                    newBoard[r][c] = num;
                    if (solve(r, c + 1)) return true;
                    newBoard[r][c] = 0;
                }
            }
            return false;
        };

        solve(0, 0);
        return newBoard;
    };

    const initGame = () => {
        const solved = generateSolvedBoard();
        setSolution(solved.map(row => [...row]));
        
        // Create puzzle by removing numbers based on difficulty
        const removalRates = { easy: 0.4, medium: 0.5, hard: 0.6 };
        const removalRate = removalRates[difficulty];
        
        const puzzle = solved.map(row => 
            row.map(val => Math.random() > removalRate ? val : 0)
        );

        // Ensure minimum clues (at least 17 for a valid puzzle)
        let filledCount = puzzle.flat().filter(v => v !== 0).length;
        while (filledCount < 17) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            if (puzzle[r][c] === 0) {
                puzzle[r][c] = solved[r][c];
                filledCount++;
            }
        }

        setInitialBoard(puzzle.map(row => [...row]));
        setBoard(puzzle.map(row => [...row]));
        setNotes(Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set<number>())));
        setSelectedCell(null);
        setTimeElapsed(0);
        setIsSolved(false);
        setIsPaused(false);
        setConflicts(new Set());
        setHintsUsed(0);
    };

    const checkConflicts = () => {
        const newConflicts = new Set<string>();
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) continue;
                
                const val = board[r][c];
                const key = `${r}-${c}`;
                
                // Check row
                for (let col = 0; col < 9; col++) {
                    if (col !== c && board[r][col] === val) {
                        newConflicts.add(key);
                        newConflicts.add(`${r}-${col}`);
                    }
                }
                
                // Check column
                for (let row = 0; row < 9; row++) {
                    if (row !== r && board[row][c] === val) {
                        newConflicts.add(key);
                        newConflicts.add(`${row}-${c}`);
                    }
                }
                
                // Check 3x3 box
                const boxRow = Math.floor(r / 3) * 3;
                const boxCol = Math.floor(c / 3) * 3;
                for (let row = boxRow; row < boxRow + 3; row++) {
                    for (let col = boxCol; col < boxCol + 3; col++) {
                        if ((row !== r || col !== c) && board[row][col] === val) {
                            newConflicts.add(key);
                            newConflicts.add(`${row}-${col}`);
                        }
                    }
                }
            }
        }
        
        setConflicts(newConflicts);
    };

    const handleCellClick = (r: number, c: number) => {
        if (isSolved) return;
        setSelectedCell({ r, c });
    };

    const handleNumberInput = (num: number) => {
        if (!selectedCell || isSolved) return;
        const { r, c } = selectedCell;
        
        // Cannot modify initial cells
        if (initialBoard[r][c] !== 0) return;

        if (inputMode === 'note') {
            // Toggle note
            const newNotes = notes.map(row => row.map(set => new Set(set)));
            if (newNotes[r][c].has(num)) {
                newNotes[r][c].delete(num);
            } else {
                newNotes[r][c].add(num);
                // Remove number if it exists
                if (board[r][c] === num) {
                    const newBoard = board.map(row => [...row]);
                    newBoard[r][c] = 0;
                    setBoard(newBoard);
                }
            }
            setNotes(newNotes);
        } else {
            // Place number
            const newBoard = board.map(row => [...row]);
            
            // If clicking the same number, remove it
            if (newBoard[r][c] === num) {
                newBoard[r][c] = 0;
            } else {
                newBoard[r][c] = num;
                // Clear notes for this cell
                const newNotes = notes.map(row => row.map(set => new Set(set)));
                newNotes[r][c].clear();
                setNotes(newNotes);
            }
            
            setBoard(newBoard);
            
            // Check if solved
            checkWin(newBoard);
        }
    };

    const handleErase = () => {
        if (!selectedCell || isSolved) return;
        const { r, c } = selectedCell;
        
        if (initialBoard[r][c] !== 0) return;

        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = 0;
        setBoard(newBoard);
        
        const newNotes = notes.map(row => row.map(set => new Set(set)));
        newNotes[r][c].clear();
        setNotes(newNotes);
    };

    const checkWin = (currentBoard: number[][]) => {
        // Check if all cells are filled
        const isFull = currentBoard.every(row => row.every(cell => cell !== 0));
        
        if (isFull) {
            // Check if solution is correct
            const isCorrect = currentBoard.every((row, r) => 
                row.every((cell, c) => cell === solution[r][c])
            );
            
            if (isCorrect && conflicts.size === 0) {
                setIsSolved(true);
                setIsPaused(true);
                toast({
                    title: "🎉 Sudoku Solved!",
                    description: `Completed in ${formatTime(timeElapsed)}`,
                });
                saveGameScore("sudoku", 1000 - timeElapsed - (hintsUsed * 50), { 
                    time: timeElapsed,
                    hints: hintsUsed,
                    difficulty 
                });
            }
        }
    };

    const handleHint = () => {
        if (!selectedCell || isSolved) return;
        const { r, c } = selectedCell;
        
        if (initialBoard[r][c] !== 0) {
            toast({ title: "Hint", description: "This cell is already filled." });
            return;
        }

        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = solution[r][c];
        setBoard(newBoard);
        
        const newNotes = notes.map(row => row.map(set => new Set(set)));
        newNotes[r][c].clear();
        setNotes(newNotes);
        
        setHintsUsed(prev => prev + 1);
        toast({ title: "Hint Used", description: `${3 - hintsUsed} hints remaining.` });
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const saveGameScore = async (gameType: string, score: number, metadata: any) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: user } = await supabase
                .from("users")
                .select("id")
                .eq("auth_id", session.user.id)
                .maybeSingle();

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

    const getCellClasses = (r: number, c: number): string => {
        const isInitial = initialBoard[r][c] !== 0;
        const isSelected = selectedCell?.r === r && selectedCell?.c === c;
        const hasConflict = conflicts.has(`${r}-${c}`);
        const isCorrect = board[r][c] !== 0 && board[r][c] === solution[r][c] && !hasConflict;
        
        // Highlight same number, row, column, and box
        const isHighlighted = selectedCell && (
            selectedCell.r === r || 
            selectedCell.c === c ||
            (Math.floor(selectedCell.r / 3) === Math.floor(r / 3) && 
             Math.floor(selectedCell.c / 3) === Math.floor(c / 3)) ||
            (board[selectedCell.r][selectedCell.c] !== 0 && 
             board[selectedCell.r][selectedCell.c] === board[r][c])
        );

        let classes = "relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg font-bold cursor-pointer border transition-all ";
        
        // Base styling
        if (isInitial) {
            classes += "bg-muted/60 dark:bg-muted/40 text-foreground font-semibold ";
        } else {
            classes += "bg-card hover:bg-accent/50 ";
            if (isCorrect) {
                classes += "text-green-600 dark:text-green-400 ";
            } else if (hasConflict) {
                classes += "text-red-600 dark:text-red-400 bg-red-500/10 ";
            } else {
                classes += "text-blue-600 dark:text-blue-400 ";
            }
        }

        // Selection and highlighting
        if (isSelected) {
            classes += "ring-2 ring-blue-500 dark:ring-blue-400 z-10 shadow-lg scale-105 ";
        } else if (isHighlighted && selectedCell) {
            classes += "bg-accent/30 ";
        }

        // Borders for 3x3 boxes
        if ((c + 1) % 3 === 0 && c !== 8) classes += "border-r-2 border-border ";
        if ((r + 1) % 3 === 0 && r !== 8) classes += "border-b-2 border-border ";

        return classes;
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-4 px-4 bg-background text-foreground">
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate("/games")} 
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{formatTime(timeElapsed)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setIsPaused(!isPaused)}
                        className="text-xs"
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={initGame} 
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Difficulty Selector */}
            <div className="flex gap-2 mb-4">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                    <Button
                        key={diff}
                        variant={difficulty === diff ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDifficulty(diff)}
                        className="capitalize"
                    >
                        {diff}
                    </Button>
                ))}
            </div>

            {/* Main Game Area */}
            <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                {/* Sudoku Grid */}
                <Card className="p-4 bg-card/50 backdrop-blur-sm">
                    <div className="grid grid-cols-9 gap-[2px] bg-border/50 border-2 border-border rounded-lg p-2">
                        {board.map((row, r) => (
                            row.map((val, c) => {
                                const cellNotes = notes[r]?.[c] || new Set<number>();
                                const hasNotes = cellNotes.size > 0;

                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        onClick={() => handleCellClick(r, c)}
                                        className={getCellClasses(r, c)}
                                    >
                                        {val !== 0 ? (
                                            <span>{val}</span>
                                        ) : hasNotes ? (
                                            <div className="grid grid-cols-3 gap-0 text-[8px] sm:text-[10px] w-full h-full p-0.5">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                                    <span
                                                        key={num}
                                                        className={`flex items-center justify-center ${
                                                            cellNotes.has(num) 
                                                                ? 'text-foreground font-medium' 
                                                                : 'text-transparent'
                                                        }`}
                                                    >
                                                        {num}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </Card>

                {/* Input Mode Toggle */}
                <div className="flex gap-2">
                    <Button
                        variant={inputMode === 'number' ? 'default' : 'outline'}
                        onClick={() => setInputMode('number')}
                        size="sm"
                    >
                        Number
                    </Button>
                    <Button
                        variant={inputMode === 'note' ? 'default' : 'outline'}
                        onClick={() => setInputMode('note')}
                        size="sm"
                    >
                        Note
                    </Button>
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-5 gap-2 w-full max-w-md">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <Button
                            key={num}
                            onClick={() => handleNumberInput(num)}
                            className="h-12 sm:h-14 text-xl font-bold bg-muted hover:bg-muted/80 text-foreground hover:scale-105 transition-transform"
                            disabled={!selectedCell || isSolved}
                        >
                            {num}
                        </Button>
                    ))}
                    <Button 
                        onClick={handleErase} 
                        className="h-12 sm:h-14 bg-muted hover:bg-muted/80 text-red-500 hover:scale-105 transition-transform"
                        disabled={!selectedCell || isSolved}
                    >
                        <Eraser className="w-5 h-5" />
                    </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full max-w-md">
                    <Button
                        variant="outline"
                        onClick={handleHint}
                        disabled={hintsUsed >= 3 || isSolved || !selectedCell}
                        className="flex-1"
                    >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Hint ({3 - hintsUsed})
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            const newBoard = solution.map(row => [...row]);
                            setBoard(newBoard);
                            setIsSolved(true);
                            setIsPaused(true);
                        }}
                        disabled={isSolved}
                        className="flex-1"
                    >
                        Show Solution
                    </Button>
                </div>

                {/* Instructions */}
                <Card className="p-4 w-full max-w-md bg-muted/30">
                    <p className="text-xs text-muted-foreground text-center">
                        <strong>Tips:</strong> Click a cell to select it. Use number keys (1-9) or click buttons to input. 
                        Press Backspace/Delete to erase. Switch to Note mode for pencil marks. Use arrow keys to navigate.
                    </p>
                </Card>
            </div>

            {/* Win Modal */}
            <AnimatePresence>
                {isSolved && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center"
                        >
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Sudoku Solved! 🎉</h2>
                            <p className="text-muted-foreground mb-4">
                                Completed in {formatTime(timeElapsed)}
                            </p>
                            <div className="flex gap-2 justify-center">
                                <Button onClick={initGame} variant="outline">
                                    New Game
                                </Button>
                                <Button onClick={() => navigate("/games")}>
                                    Back to Games
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Sudoku;
