import React from 'react';
import { cn } from '@/lib/utils';
import AppCard from './AppCard';

const ListItemCard = ({ 
  leading, 
  title, 
  subtitle, 
  trailing, 
  statusBadge,
  className,
  interactive = false,
  onClick
}) => {
  return (
    <AppCard 
      className={cn("flex flex-col w-full relative", className)} 
      interactive={interactive}
      onClick={onClick}
    >
      {statusBadge && (
        <div className="absolute top-4 right-4">
          {statusBadge}
        </div>
      )}
      
      <div className="flex items-start gap-4">
        {leading && (
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground overflow-hidden border border-border">
            {typeof leading === 'string' ? (
              <span className="font-bold text-[16px]">{leading}</span>
            ) : (
              <div className="[&>svg]:w-6 [&>svg]:h-6 text-muted-foreground">
                {leading}
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0 pr-10">
          <h4 className="text-[16px] font-bold text-foreground leading-tight mb-1 truncate">{title}</h4>
          {subtitle && (
            <p className="text-[14px] text-muted-foreground mb-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      
      {trailing && (
        <div className="flex justify-end items-end mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            {trailing}
          </div>
        </div>
      )}
    </AppCard>
  );
};

export default ListItemCard;