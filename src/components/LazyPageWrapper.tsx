import React, { Suspense } from 'react';

interface LazyPageWrapperProps {
  children: React.ReactNode;
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
        <span className="text-3xl">🧠</span>
      </div>
      <p className="text-muted">Loading...</p>
    </div>
  </div>
);

export const LazyPageWrapper: React.FC<LazyPageWrapperProps> = ({ children }) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
};