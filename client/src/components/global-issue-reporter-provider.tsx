
import React, { createContext, useContext, useState, useEffect } from 'react';
import { GlobalIssueReporter } from './github/global-issue-reporter';

interface GlobalIssueReporterContextType {
  isOpen: boolean;
  isMinimized: boolean;
  openReporter: () => void;
  closeReporter: () => void;
  minimizeReporter: () => void;
}

const GlobalIssueReporterContext = createContext<GlobalIssueReporterContextType | undefined>(undefined);

export const useGlobalIssueReporter = () => {
  const context = useContext(GlobalIssueReporterContext);
  if (!context) {
    throw new Error('useGlobalIssueReporter must be used within GlobalIssueReporterProvider');
  }
  return context;
};

export function GlobalIssueReporterProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const openReporter = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeReporter = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const minimizeReporter = () => {
    setIsMinimized(true);
  };

  // Global keyboard shortcut to open issue reporter
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + I to open issue reporter
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        if (!isOpen) {
          openReporter();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  return (
    <GlobalIssueReporterContext.Provider value={{
      isOpen,
      isMinimized,
      openReporter,
      closeReporter,
      minimizeReporter
    }}>
      {children}
      {isOpen && (
        <GlobalIssueReporter
          onClose={closeReporter}
          onMinimize={minimizeReporter}
          isMinimized={isMinimized}
        />
      )}
    </GlobalIssueReporterContext.Provider>
  );
}
