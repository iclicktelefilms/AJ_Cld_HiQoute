import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const AppIconButton = forwardRef(({ 
  icon: Icon, 
  className, 
  onClick, 
  disabled,
  variant = 'ghost',
  ...props 
}, ref) => {
  const variants = {
    ghost: "bg-transparent hover:bg-secondary text-foreground",
    filled: "bg-primary text-primary-foreground hover:bg-primary/90",
    tonal: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outlined: "border border-border bg-card hover:bg-secondary text-foreground"
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-[40px] h-[40px] flex items-center justify-center rounded-[var(--radius-lg)] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-[20px] h-[20px]" />}
    </button>
  );
});

AppIconButton.displayName = 'AppIconButton';
export default AppIconButton;