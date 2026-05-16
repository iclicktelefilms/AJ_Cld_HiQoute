import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Layers, FileText, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const AppDrawer = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/quotations', label: 'Quotations', icon: FileText },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/packages', label: 'Packages', icon: Layers },
    { path: '/items', label: 'Items', icon: Package },
  ];

  return (
    <aside className="hidden md:flex w-[240px] flex-col bg-card border-r border-border h-full z-50 transition-colors duration-200">
      <div className="p-6 flex items-center h-[80px]">
        {/* Logo is in AppBar/Header */}
      </div>
      <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-[16px] py-[12px] rounded-[8px] text-[14px] font-medium transition-all duration-200",
                isActive 
                  ? "bg-secondary text-primary" 
                  : "text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className={cn("w-[24px] h-[24px]", isActive ? "text-primary" : "text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AppDrawer;