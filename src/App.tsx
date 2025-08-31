import { useState, useEffect } from 'react'
import { Header } from './components/layout/Header'
import { Navigation } from './components/layout/Navigation'
import { QuickPage } from './pages/QuickPage'
import { ThoughtsPage } from './pages/ThoughtsPage'
import { TodosPage } from './pages/TodosPage'
import { RadiologyPage } from './pages/RadiologyPage'
import { SearchPage } from './pages/SearchPage'
import { LoginForm } from './components/auth/LoginForm'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { dataService } from './services/dataService'

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'quick' | 'thoughts' | 'todos' | 'radiology' | 'search'>('quick')
  const [dataServiceReady, setDataServiceReady] = useState(false);

  // 사용자가 로그인하면 데이터 서비스 초기화
  useEffect(() => {
    const initializeDataService = async () => {
      if (user) {
        try {
          await dataService.initializeWithUser(user);
          setDataServiceReady(true);
        } catch (error) {
          console.error('Failed to initialize data service:', error);
          // 실패해도 로컬 모드로 계속 진행
          setDataServiceReady(true);
        }
      }
    };

    initializeDataService();
  }, [user]);

  if (loading || (user && !dataServiceReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-3xl">🧠</span>
          </div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'quick':
        return <QuickPage />
      case 'thoughts':
        return <ThoughtsPage />
      case 'todos':
        return <TodosPage />
      case 'radiology':
        return <RadiologyPage />
      case 'search':
        return <SearchPage />
      default:
        return <QuickPage />
    }
  }

  return (
    <div className="min-h-screen transition-all duration-500">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="py-6">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App
