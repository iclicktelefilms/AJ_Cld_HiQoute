import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AppButton from './AppButton';

const AboutAppModal = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-[var(--radius-xl)] p-6 bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-bold text-center mb-4">About Pixora</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="w-20 h-20 bg-secondary rounded-[var(--radius-xl)] flex items-center justify-center mb-2">
            <img 
              src="https://horizons-cdn.hostinger.com/af45910f-2c61-461a-98b0-b7374909c0ea/df505f53babf4b4340fd291f6c947f6a.png" 
              alt="Pixora Icon" 
              className="w-12 h-12 object-contain"
            />
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="text-[18px] font-bold text-foreground">Pixora Photography</h3>
            <p className="text-[14px] text-muted-foreground">Version 1.0.0</p>
          </div>
          
          <p className="text-[14px] text-center text-foreground mt-2">
            Professional quotation management for photographers.
          </p>
          
          <p className="text-[12px] text-muted-foreground mt-6">
            © 2024 Pixora. All rights reserved.
          </p>
        </div>
        
        <div className="mt-6">
          <AppButton variant="tonal" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutAppModal;