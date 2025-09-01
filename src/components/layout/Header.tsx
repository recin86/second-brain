import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageToggle } from '../LanguageToggle';
import { initClient, handleAuthClick, handleSignoutClick } from '../../services/googleCalendar';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);

  useEffect(() => {
    const updateAuthStatus = (isSignedIn: boolean) => {
      setIsGoogleSignedIn(isSignedIn);
    };
    initClient(updateAuthStatus);
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur-lg" style={{borderBottom: '1px solid rgba(78, 166, 109, 0.2)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 sm:h-24">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold">🧠</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-primary tracking-tight truncate">
                {t('header.title')}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-muted truncate">
                {t('header.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:block">
              <LanguageToggle language={language} onLanguageChange={setLanguage} />
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {isGoogleSignedIn ? (
                <button onClick={handleSignoutClick} className="btn-secondary text-xs sm:text-sm p-2 sm:px-3 sm:py-1">
                  <span className="hidden sm:inline">❌</span>
                  <span className="sm:hidden">📅❌</span>
                </button>
              ) : (
                <button onClick={handleAuthClick} className="btn-primary text-xs sm:text-sm p-2 sm:px-3 sm:py-1">
                  📅
                </button>
              )}

              {user && (
                <div className="flex items-center space-x-1 sm:space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-primary truncate max-w-[120px]">
                      {user.displayName || user.email || 'Guest User'}
                    </p>
                    <p className="text-xs text-muted">
                      {user.isAnonymous ? 'Guest' : 'Signed In'}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm font-semibold text-primary/70 hover:text-primary hover:bg-white/10 transition-all duration-200"
                  >
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sm:hidden">👋</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};