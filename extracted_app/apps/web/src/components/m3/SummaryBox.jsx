import React from 'react';
import { cn } from '@/lib/utils';

const SummaryBox = ({ title, value, icon: Icon, className }) => {
  return (
    <div className={cn(
      "flex flex-col justify-between h-[90px] md:h-[100px] p-[16px] rounded-[12px] bg-[#ffffff] border border-[#e0e0e0] transition-all duration-200 cursor-default hover:bg-[#f5f5f5] hover:pixora-shadow-hover", 
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="text-[#ff3131]">
          {Icon && <Icon className="w-[20px] h-[20px]" />}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-medium text-[#666666] mb-0.5 uppercase tracking-wider">{title}</p>
        <h3 className="text-[16px] font-bold text-[#000000]">{value}</h3>
      </div>
    </div>
  );
};

export default SummaryBox;