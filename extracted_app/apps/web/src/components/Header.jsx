import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfileDropdown from '@/components/m3/ProfileDropdown.jsx';
import PWAInstallButton from '@/components/PWAInstallButton.jsx';
import { Camera } from 'lucide-react';

const Header = () => {
  const { isAuthenticated, currentUser, isDirectLogin, switchBackToAdmin } = useAuth();
  const location = useLocation();

  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 w-full shadow-sm flex-shrink-0">
      {isDirectLogin && (
        <div className="bg-primary text-primary-foreground text-sm font-bold py-2 px-4 flex justify-between items-center">
          <span className="truncate mr-2">Viewing as: {currentUser?.name || currentUser?.email}</span>
          <button 
            onClick={switchBackToAdmin} 
            className="underline hover:text-primary-foreground/80 transition-colors whitespace-nowrap min-h-[32px] px-2 -mr-2"
          >
            Return to Admin
          </button>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link to="/" className="flex items-center gap-2 transition-transform active:scale-95">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight hidden sm:block">Pixora Studio</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <PWAInstallButton />
          
          {isAuthenticated ? (
            <div className="flex-shrink-0">
              <ProfileDropdown />
            </div>
          ) : (
            <Link 
              to="/login" 
              className="text-sm font-bold text-primary-foreground bg-primary px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] min-h-[40px] flex items-center shadow-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;