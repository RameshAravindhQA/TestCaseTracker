import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

const TUTORIAL_STORAGE_KEY = 'testcasetracker-tutorial-state';

interface TutorialState {
  completedModules: string[];
  hasSeenWelcome: boolean;
  isEnabled: boolean;
  currentModule?: string;
}

const DEFAULT_TUTORIAL_STATE: TutorialState = {
  completedModules: [],
  hasSeenWelcome: false,
  isEnabled: true,
};

export function useTutorial() {
  const { user } = useAuth();
  const [tutorialState, setTutorialState] = useState<TutorialState>(DEFAULT_TUTORIAL_STATE);
  const [isVisible, setIsVisible] = useState(false);

  // Load tutorial state from localStorage
  useEffect(() => {
    if (user) {
      const storageKey = `${TUTORIAL_STORAGE_KEY}-${user.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTutorialState({ ...DEFAULT_TUTORIAL_STATE, ...parsed });
        } catch (error) {
          console.error('Failed to parse tutorial state:', error);
        }
      }
    }
  }, [user]);

  // Save tutorial state to localStorage
  const saveTutorialState = useCallback((state: TutorialState) => {
    if (user) {
      const storageKey = `${TUTORIAL_STORAGE_KEY}-${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(state));
      setTutorialState(state);
    }
  }, [user]);

  // Show welcome tutorial for new users
  useEffect(() => {
    if (user && tutorialState.isEnabled && !tutorialState.hasSeenWelcome) {
      // Show tutorial after a short delay to let the UI settle
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, tutorialState.isEnabled, tutorialState.hasSeenWelcome]);

  const showTutorial = useCallback((moduleId?: string) => {
    if (tutorialState.isEnabled) {
      setTutorialState(prev => ({
        ...prev,
        currentModule: moduleId,
        hasSeenWelcome: true
      }));
      setIsVisible(true);
    }
  }, [tutorialState.isEnabled]);

  const hideTutorial = useCallback(() => {
    setIsVisible(false);
    saveTutorialState({
      ...tutorialState,
      hasSeenWelcome: true,
      currentModule: undefined
    });
  }, [tutorialState, saveTutorialState]);

  const completeModule = useCallback((moduleId: string) => {
    const newState = {
      ...tutorialState,
      completedModules: [...tutorialState.completedModules.filter(id => id !== moduleId), moduleId],
      currentModule: undefined
    };
    saveTutorialState(newState);
  }, [tutorialState, saveTutorialState]);

  const resetTutorial = useCallback(() => {
    const newState = {
      ...DEFAULT_TUTORIAL_STATE,
      isEnabled: true
    };
    saveTutorialState(newState);
    setIsVisible(false);
  }, [saveTutorialState]);

  const disableTutorial = useCallback(() => {
    const newState = {
      ...tutorialState,
      isEnabled: false,
      hasSeenWelcome: true
    };
    saveTutorialState(newState);
    setIsVisible(false);
  }, [tutorialState, saveTutorialState]);

  const enableTutorial = useCallback(() => {
    const newState = {
      ...tutorialState,
      isEnabled: true
    };
    saveTutorialState(newState);
  }, [tutorialState, saveTutorialState]);

  const isModuleCompleted = useCallback((moduleId: string) => {
    return tutorialState.completedModules.includes(moduleId);
  }, [tutorialState.completedModules]);

  const getCompletionProgress = useCallback(() => {
    const totalModules = 5; // Update this based on actual number of modules
    const completedCount = tutorialState.completedModules.length;
    return {
      completed: completedCount,
      total: totalModules,
      percentage: Math.round((completedCount / totalModules) * 100)
    };
  }, [tutorialState.completedModules]);

  return {
    // State
    isVisible,
    tutorialState,
    
    // Actions
    showTutorial,
    hideTutorial,
    completeModule,
    resetTutorial,
    disableTutorial,
    enableTutorial,
    
    // Helpers
    isModuleCompleted,
    getCompletionProgress,
    
    // Computed
    isNewUser: !tutorialState.hasSeenWelcome,
    isEnabled: tutorialState.isEnabled,
    completedModules: tutorialState.completedModules,
    currentModule: tutorialState.currentModule
  };
}