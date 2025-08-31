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
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-24">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center">
              <span className="text-xl font-bold">🧠</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-primary tracking-tight">
                {t('header.title')}
              </h1>
              <p className="text-sm font-semibold text-muted">
                {t('header.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageToggle language={language} onLanguageChange={setLanguage} />
            
            {isGoogleSignedIn ? (
              <button onClick={handleSignoutClick} className="btn-secondary">
                캘린더 연동 해제
              </button>
            ) : (
              <button onClick={handleAuthClick} className="btn-primary">
                캘린더 연동
              </button>
            )}

            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">
                    {user.displayName || user.email || 'Guest User'}
                  </p>
                  <p className="text-xs text-muted">
                    {user.isAnonymous ? 'Guest Session' : 'Signed In'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1 rounded-lg text-sm font-semibold text-primary/70 hover:text-primary hover:bg-white/10 transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};