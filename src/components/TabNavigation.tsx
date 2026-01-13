import { LayoutDashboard, BookOpen, Gamepad2, BarChart3, Calendar, BookMarked, ShoppingBag, Trophy, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/overview' },
    { id: 'learn', label: 'Learn', icon: BookOpen, path: '/learn' },
    { id: 'games', label: 'Games', icon: Gamepad2, path: '/games' },
  ];

  const moreTabs = [
    { id: 'habits', label: 'Habits', icon: Calendar, path: '/habits' },
    { id: 'journal', label: 'Journal', icon: BookMarked, path: '/journal' },
    // Hidden for now: Analytics, Shop, Tournaments
    // { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    // { id: 'shop', label: 'Shop', icon: ShoppingBag, path: '/shop' },
    // { id: 'tournaments', label: 'Tournaments', icon: Trophy, path: '/tournaments' },
  ];

  const profileTabs = [
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/overview' }, // Settings opens modal on overview
  ];

  const handleTabClick = (tab: typeof mainTabs[0] | typeof moreTabs[0]) => {
    onTabChange(tab.id);
    navigate(tab.path);
  };

  // Determine active tab from pathname
  const currentPath = location.pathname;
  const allTabs = [...mainTabs, ...moreTabs];
  const activeTabFromPath = allTabs.find(tab => currentPath.startsWith(tab.path))?.id || 'overview';

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-screen fixed left-0 top-0 z-50">
        <div className="flex flex-col h-full glass-panel border-y-0 border-l-0 border-r border-white/20 rounded-none">
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Morning Loop
            </h1>
          </div>

          <div className="flex-1 px-4 space-y-2 overflow-y-auto">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTabFromPath === tab.id;
              return (
                <motion.div
                  key={tab.id}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 text-base font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}
                    onClick={() => handleTabClick(tab)}
                    aria-label={`Navigate to ${tab.label}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={cn('w-5 h-5', isActive && 'text-primary')} aria-hidden="true" />
                    {tab.label}
                  </Button>
                </motion.div>
              );
            })}
            
            <div className="pt-4 border-t border-white/10 space-y-2">
              {/* Profile and Settings */}
              {profileTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTabFromPath === tab.id || (tab.id === 'settings' && location.pathname === '/overview');
                return (
                  <motion.div
                    key={tab.id}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3 text-base font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      )}
                      onClick={() => {
                        if (tab.id === 'settings') {
                          // Trigger settings modal on overview
                          window.dispatchEvent(new CustomEvent('openSettings'));
                          navigate('/overview');
                        } else {
                          handleTabClick(tab);
                        }
                      }}
                      aria-label={`Navigate to ${tab.label}`}
                    >
                      <Icon className={cn('w-5 h-5', isActive && 'text-primary')} aria-hidden="true" />
                      {tab.label}
                    </Button>
                  </motion.div>
                );
              })}
              
              {/* More dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <span className="w-5 h-5">⋯</span>
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {moreTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTabFromPath === tab.id;
                    return (
                      <DropdownMenuItem
                        key={tab.id}
                        onClick={() => handleTabClick(tab)}
                        className={cn(
                          'cursor-pointer',
                          isActive && 'bg-primary/10 text-primary'
                        )}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar - Only main 3 tabs for swipe flow */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTabFromPath === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-label={`Navigate to ${tab.label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                <span className={cn('text-xs font-medium', isActive && 'font-semibold')}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
          
          {/* More button for mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                  'text-muted-foreground'
                )}
                aria-label="More options"
              >
                <span className="w-5 h-5 text-2xl leading-none">⋯</span>
                <span className="text-xs font-medium">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="mb-2 w-48">
              {profileTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'settings') {
                        window.dispatchEvent(new CustomEvent('openSettings'));
                        navigate('/overview');
                      } else {
                        handleTabClick(tab);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </DropdownMenuItem>
                );
              })}
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className="cursor-pointer"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};

