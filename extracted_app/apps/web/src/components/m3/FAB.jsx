import React from 'react';
import { cn } from '@/lib/utils';

const FAB = ({ onClick, disabled, icon: Icon, className, ariaLabel }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "fixed bottom-[88px] right-6 md:bottom-8 md:right-8 w-[56px] h-[56px] rounded-[16px] bg-[#ff3131] text-white flex items-center justify-center shadow-lg hover:bg-[#ff1a1a] active:scale-95 transition-all duration-200 z-40 disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      aria-label={ariaLabel || "Floating Action Button"}
    >
      {Icon && <Icon className="w-6 h-6 text-white" />}
    </button>
  );
};

export default FAB;