import React from 'react';
import { cn } from '@/lib/utils';

const AppButton = ({ 
  children, 
  variant = 'filled', 
  className, 
  disabled, 
  loading,
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none overflow-hidden";
  
  const variants = {
    filled: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    tonal: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outlined: "border border-border bg-transparent text-foreground hover:bg-muted",
    text: "bg-transparent text-primary hover:bg-primary/10",
  };

  return (
    <button
      type={type}
      className={cn(
        baseStyles,
        variants[variant],
        "h-[42px] px-6 rounded-[12px] text-[14px]", // Reduced size slightly for better proportions
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
};

export default AppButton;