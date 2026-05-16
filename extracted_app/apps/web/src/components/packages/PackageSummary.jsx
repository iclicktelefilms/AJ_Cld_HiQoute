import React from 'react';
import { formatINR } from '@/lib/currencyUtils';

const PackageSummary = ({ formData, itemsTotal }) => {
  const baseAmount = Number(formData.baseAmount) || 0;
  const discountValue = Number(formData.discount?.value) || 0;
  
  let discountAmount = 0;
  if (formData.discount?.type === 'percentage') {
    discountAmount = (baseAmount + itemsTotal) * (discountValue / 100);
  } else {
    discountAmount = discountValue;
  }
  
  const adjustment = Number(formData.adjustment) || 0;
  const finalAmount = baseAmount + itemsTotal - discountAmount + adjustment;

  return (
    <div className="bg-card border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-foreground border-b border-gray-100 pb-3">Pricing Summary</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Base Amount</span>
          <span className="font-medium text-foreground">{formatINR(baseAmount)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Items Total</span>
          <span className="font-medium text-foreground">{formatINR(itemsTotal)}</span>
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-destructive">
            <span>Discount {formData.discount?.type === 'percentage' ? `(${discountValue}%)` : ''}</span>
            <span className="font-medium">-{formatINR(discountAmount)}</span>
          </div>
        )}
        
        {adjustment !== 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{formData.adjustmentHeading || 'Adjustment'}</span>
            <span className="font-medium text-foreground">
              {adjustment > 0 ? '+' : ''}{formatINR(adjustment)}
            </span>
          </div>
        )}
        
        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-base font-bold text-foreground">Final Amount</span>
          <span className="text-lg font-bold text-primary">{formatINR(finalAmount)}</span>
        </div>
      </div>
    </div>
  );
};

export default PackageSummary;