import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
}

export function Sidebar({ items, collapsed = false, onCollapse, className }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen bg-charcoal-950 border-r border-charcoal-800',
      'transition-all duration-300 flex flex-col',
      collapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-charcoal-800">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-white font-semibold text-lg">AttendPro</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">A</span>
          </div>
        )}
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className="text-charcoal-400 hover:text-white p-1 rounded"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-blue-500/15 text-blue-400 border-l-2 border-blue-500'
                      : 'text-charcoal-300 hover:bg-charcoal-800 hover:text-white'
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-charcoal-800">
          <div className="text-xs text-charcoal-500">
            <p>AttendPro v1.0</p>
            <p className="mt-1">© 2026 University System</p>
          </div>
        </div>
      )}
    </aside>
  );
}