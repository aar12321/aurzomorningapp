import { Home, Wrench } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function TabNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'home', label: 'Home', icon: Home, path: '/app' },
        { id: 'tools', label: 'Tools', icon: Wrench, path: '/app/tools' },
    ];

    return (
        <nav className="tab-nav">
            <div className="flex items-center justify-around py-2">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path ||
                        (tab.id === 'home' && location.pathname === '/app');

                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={`tab-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <tab.icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
