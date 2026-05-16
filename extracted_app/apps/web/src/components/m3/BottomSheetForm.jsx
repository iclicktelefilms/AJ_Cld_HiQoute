import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AppButton from './AppButton';

const BottomSheetForm = ({ open, onOpenChange, title, children, onSave, isSaving, saveText = "Save" }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[16px] bg-white border-t border-gray-border shadow-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl sm:mx-auto sm:rounded-[16px] sm:mb-4 sm:h-auto sm:border">
        <SheetHeader className="mb-4 text-left pt-2">
          <SheetTitle className="text-[20px] font-bold text-black">{title}</SheetTitle>
        </SheetHeader>
        
        <div className="py-2 px-1">
          {children}
        </div>
        
        <div className="flex justify-end gap-3 mt-8 pb-4">
          <AppButton variant="tonal" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </AppButton>
          <AppButton variant="filled" onClick={onSave} loading={isSaving}>
            {saveText}
          </AppButton>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BottomSheetForm;