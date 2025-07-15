
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FullScreenNavadhitiLoader } from '@/components/ui/navadhiti-loader';

interface LoadingContextType {
  isLoading: boolean;
  loadingText: string;
  showLoader: (text?: string) => void;
  hideLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const showLoader = (text?: string) => {
    if (text) setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, loadingText, showLoader, hideLoader }}>
      {children}
      <FullScreenNavadhitiLoader isVisible={isLoading} text={loadingText} />
    </LoadingContext.Provider>
  );
};
