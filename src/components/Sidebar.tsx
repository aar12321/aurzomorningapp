import {
    LayoutDashboard,
    Gamepad2,
    Newspaper,
    CloudSun,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
    userEmail?: string;
}

export const Sidebar = ({ activeTab, setActiveTab, onLogout, userEmail }: SidebarProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: "topics", label: "Dashboard", icon: LayoutDashboard },
        { id: "games", label: "Games", icon: Gamepad2 },
        { id: "news", label: "News", icon: Newspaper },
        { id: "weather", label: "Weather", icon: CloudSun },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full glass-panel border-y-0 border-l-0 border-r border-white/20 rounded-none">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Morning Loop
                </h1>
            </div>

            <div className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 text-base font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            )}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsOpen(false);
                            }}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                            {item.label}
                        </Button>
                    );
                })}
            </div>

            <div className="p-4 border-t border-border/50 space-y-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-white/5"
                    onClick={() => {
                        // Settings usually opens a modal in the current implementation
                        // We might need to handle this differently or pass a prop
                        setActiveTab("settings"); // Assuming we can switch to a settings view or handle it
                        setIsOpen(false);
                    }}
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Button>

                <div className="pt-2 mt-2 border-t border-border/50">
                    <div className="px-4 py-2 text-xs text-muted-foreground truncate mb-2">
                        {userEmail}
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={onLogout}
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 h-screen fixed left-0 top-0 z-50">
                <SidebarContent />
            </div>

            {/* Mobile Trigger */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-md border-border/50">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 border-r border-border/50 bg-background/95 backdrop-blur-xl">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
};
