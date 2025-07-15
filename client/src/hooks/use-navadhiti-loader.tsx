
import { useState, useCallback } from 'react';
import { FullScreenNavadhitiLoader } from '@/components/ui/navadhiti-loader';

export const useNavadhitiLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const showLoader = useCallback((text?: string) => {
    if (text) setLoadingText(text);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  const LoaderComponent = useCallback(() => (
    <FullScreenNavadhitiLoader 
      isVisible={isLoading} 
      text={loadingText} 
    />
  ), [isLoading, loadingText]);

  return {
    isLoading,
    showLoader,
    hideLoader,
    LoaderComponent,
    setLoadingText
  };
};

// Hook for async operations with automatic loader management
export const useAsyncWithLoader = () => {
  const { showLoader, hideLoader, LoaderComponent } = useNavadhitiLoader();

  const executeWithLoader = useCallback(async <T,>(
    asyncOperation: () => Promise<T>,
    loadingText?: string
  ): Promise<T> => {
    try {
      showLoader(loadingText);
      const result = await asyncOperation();
      return result;
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  return {
    executeWithLoader,
    LoaderComponent
  };
};
import { useState, useCallback } from 'react';

interface UseNavadhitiLoaderReturn {
  isLoading: boolean;
  loadingText: string;
  showLoader: (text?: string) => void;
  hideLoader: () => void;
  withLoader: <T>(promise: Promise<T>, text?: string) => Promise<T>;
}

export function useNavadhitiLoader(): UseNavadhitiLoaderReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const showLoader = useCallback((text = 'Loading...') => {
    setLoadingText(text);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoader = useCallback(async <T,>(
    promise: Promise<T>, 
    text = 'Loading...'
  ): Promise<T> => {
    showLoader(text);
    try {
      const result = await promise;
      return result;
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  return {
    isLoading,
    loadingText,
    showLoader,
    hideLoader,
    withLoader
  };
}

export default useNavadhitiLoader;
