import React from 'react';
import Header from '@/components/Header';
import AppDrawer from './AppDrawer';
import BottomNavigation from './BottomNavigation';

const AppScaffold = ({ fab, children }) => {
  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden w-full transition-colors duration-200 relative z-0">
      <AppDrawer />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 pb-28 md:pb-8 md:p-8 w-full relative z-10">
          <div className="max-w-5xl mx-auto w-full min-h-full bg-card rounded-2xl shadow-sm border border-border p-4 md:p-8">
            {children}
          </div>
        </main>

        {fab && (
          <div className="fixed bottom-[88px] md:bottom-8 right-6 z-40 md:hidden">
            {fab}
          </div>
        )}
        
        <BottomNavigation />
      </div>
    </div>
  );
};

export default AppScaffold;