import { ReactNode } from 'react';
import { Bell, Menu, User, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { getInitials, roleLabels } from '../lib/utils';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 right-0 z-30 h-16 bg-charcoal-950/80 backdrop-blur-md border-b border-charcoal-800">
      <div className="flex items-center justify-between h-full px-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-charcoal-300 hover:text-white p-2 rounded-lg hover:bg-charcoal-800"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <button className="relative p-2 text-charcoal-300 hover:text-white rounded-lg hover:bg-charcoal-800">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-charcoal-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user ? getInitials(user.email) : 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-white text-sm font-medium">
                {user?.email.split('@')[0]}
              </p>
              <p className="text-charcoal-400 text-xs">
                {user ? roleLabels[user.role] : ''}
              </p>
            </div>
            <button
              onClick={logout}
              className="ml-2 p-1.5 text-charcoal-400 hover:text-red-400 rounded-lg hover:bg-charcoal-800"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}