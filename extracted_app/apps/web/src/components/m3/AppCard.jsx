import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const AppCard = forwardRef(({ className, children, interactive = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[16px] bg-card p-[16px] transition-all duration-200 border border-border text-foreground shadow-sm",
        interactive && "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

AppCard.displayName = 'AppCard';
export default AppCard;