import { useState, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { NavItem } from '../types/nav';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  navItems: NavItem[];
  children?: ReactNode;
}

export function AppLayout({ navItems, children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-charcoal-950">
      <Sidebar
        items={navItems}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        className={mobileMenuOpen ? 'translate-x-0' : ''}
      />

      <div className={cn(
        'transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      )}>
        <Topbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 lg:p-6 pt-20 lg:pt-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

function cn(...inputs: Array<string | undefined>) {
  return inputs.filter(Boolean).join(' ');
}