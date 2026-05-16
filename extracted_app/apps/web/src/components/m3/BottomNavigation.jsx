import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Layers, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/quotations', label: 'Quotations', icon: FileText },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/packages', label: 'Packages', icon: Layers },
    { path: '/items', label: 'Items', icon: Box },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-card flex justify-around items-center h-[64px] z-40 pb-safe transition-colors duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-border">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/dashboard');
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] gap-1 active:scale-95 transition-transform"
          >
            <div className="p-1 transition-colors duration-300 flex flex-col items-center gap-1">
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-bold transition-colors duration-300", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;