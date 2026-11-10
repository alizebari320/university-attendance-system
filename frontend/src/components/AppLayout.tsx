import { useState, ReactNode, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NavItem } from '../types/nav';
import { cn } from '../lib/utils';

interface LayoutProps {
  navItems: NavItem[];
  children?: ReactNode;
}

export function AppLayout({ navItems, children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-charcoal-950">
      <Sidebar
        items={navItems}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        className={mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={cn(
        'transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      )}>
        <Topbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 pb-6 pt-20 lg:px-6 lg:pb-6 lg:pt-24">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
