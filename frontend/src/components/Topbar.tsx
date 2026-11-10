import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { getInitials, roleLabels } from '../lib/utils';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications')
      .then(res => setUnread(res.data.data.filter((n: any) => !n.readAt).length))
      .catch(() => setUnread(0));
  }, [user]);

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-16 bg-charcoal-950/80 backdrop-blur-md border-b border-charcoal-800">
      <div className="flex items-center justify-between h-full px-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-charcoal-300 hover:text-white p-2 rounded-lg hover:bg-charcoal-800"
          aria-label="Toggle navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 ml-auto">
          <Link
            to="/notifications"
            className="relative p-2 text-charcoal-300 hover:text-white rounded-lg hover:bg-charcoal-800"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-semibold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

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
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
