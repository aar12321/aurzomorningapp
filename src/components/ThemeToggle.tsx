import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getPreference, savePreference } from "@/lib/user-preferences-service";

export const ThemeToggle = () => {
    const [theme, setTheme] = useState<"sunrise" | "sunset">("sunrise");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load theme preference
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await getPreference('theme');
            if (savedTheme) {
                setTheme(savedTheme);
                applyTheme(savedTheme);
            } else {
                // Fallback to localStorage for immediate feedback
                const localTheme = localStorage.getItem("theme") as "sunrise" | "sunset";
                if (localTheme) {
                    setTheme(localTheme);
                    applyTheme(localTheme);
                }
            }
        } catch (error) {
            console.error("Error loading theme:", error);
            // Fallback to localStorage
            const localTheme = localStorage.getItem("theme") as "sunrise" | "sunset";
            if (localTheme) {
                setTheme(localTheme);
                applyTheme(localTheme);
            }
        }
    };

    const applyTheme = (newTheme: "sunrise" | "sunset") => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (newTheme === "sunset") {
            root.classList.add("dark");
        } else {
            root.classList.add("light");
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === "sunrise" ? "sunset" : "sunrise";

        // Optimistic update
        setTheme(newTheme);
        applyTheme(newTheme);

        // Persist to DB and localStorage
        setLoading(true);
        try {
            await savePreference('theme', newTheme);
        } catch (error) {
            console.error("Error saving theme preference:", error);
            toast.error("Failed to save theme preference");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            disabled={loading}
            className="rounded-full w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-300"
            title={`Switch to ${theme === "sunrise" ? "Sunset" : "Sunrise"} Mode`}
        >
            {theme === "sunrise" ? (
                <Sun className="h-5 w-5 text-orange-400 rotate-0 scale-100 transition-all" />
            ) : (
                <Moon className="h-5 w-5 text-purple-400 rotate-0 scale-100 transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
};
