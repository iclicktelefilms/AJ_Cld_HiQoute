import React from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall.js';

const PWAInstallButton = () => {
  const { canInstall, handleInstall } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <button 
      onClick={handleInstall} 
      className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
      aria-label="Install App"
    >
      <Download className="w-4 h-4" />
      <span>Install App</span>
    </button>
  );
};

export default PWAInstallButton;