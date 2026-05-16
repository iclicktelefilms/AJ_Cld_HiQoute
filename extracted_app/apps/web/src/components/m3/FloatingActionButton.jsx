import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const FloatingActionButton = ({ onClick, disabled, icon: Icon = Plus, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-[var(--fab-size)] h-[var(--fab-size)] rounded-2xl bg-primary text-primary-foreground flex items-center justify-center m3-elevation-6 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      aria-label="Floating Action Button"
    >
      <Icon className="w-6 h-6" />
    </button>
  );
};

export default FloatingActionButton;