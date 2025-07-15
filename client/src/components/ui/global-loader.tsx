
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OverlayNavadhitiLoader } from './navadhiti-loader';

interface GlobalLoaderContextType {
  isLoading: boolean;
  loadingText: string;
  showLoader: (text?: string) => void;
  hideLoader: () => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

export function useGlobalLoader() {
  const context = useContext(GlobalLoaderContext);
  if (!context) {
    throw new Error('useGlobalLoader must be used within a GlobalLoaderProvider');
  }
  return context;
}

interface GlobalLoaderProviderProps {
  children: ReactNode;
}

export function GlobalLoaderProvider({ children }: GlobalLoaderProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const showLoader = (text = 'Loading...') => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  return (
    <GlobalLoaderContext.Provider 
      value={{ 
        isLoading, 
        loadingText, 
        showLoader, 
        hideLoader 
      }}
    >
      {children}
      <OverlayNavadhitiLoader isVisible={isLoading} text={loadingText} />
    </GlobalLoaderContext.Provider>
  );
}

export default GlobalLoaderProvider;
