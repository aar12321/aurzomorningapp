import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TabNavigation } from './TabNavigation';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
  showSettings?: boolean;
  onSettingsClick?: () => void;
}

export const Layout = ({ children, showSettings, onSettingsClick }: LayoutProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Determine active tab from pathname
    if (location.pathname.startsWith('/learn')) {
      setActiveTab('learn');
    } else if (location.pathname.startsWith('/games')) {
      setActiveTab('games');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  // Don't show navigation on game pages or quiz pages
  const hideNav = location.pathname.startsWith('/games/') || 
                  location.pathname.startsWith('/quiz/') || 
                  location.pathname.startsWith('/results/');

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main content area */}
      <main className="md:pl-64 pb-16 md:pb-0" style={{ minHeight: '100vh' }}>
        {/* Settings button - only show on overview */}
        {location.pathname === '/overview' && (
          <div className="fixed top-4 right-4 z-40 flex items-center gap-4">
            <ThemeToggle />
            {onSettingsClick && (
              <Button
                variant="outline"
                size="icon"
                onClick={onSettingsClick}
                className="rounded-full border-border/50 hover:bg-accent bg-background/80 backdrop-blur-md"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

