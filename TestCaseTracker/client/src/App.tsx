import React, { lazy, ComponentType, Suspense, useEffect, useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { GitHubIssueReporter } from "@/components/ui/github-issue-reporter";
import { ProtectedRoute } from "@/lib/protected-route";
import { SoundProvider } from '@/hooks/use-sound-provider';

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import ProjectsPage from "@/pages/projects/index";
import ProjectDetailPage from "@/pages/projects/[id]";
import ModulesPage from "@/pages/modules/index";
import TestCasesPage from "@/pages/test-cases/index";
import BugsPage from "@/pages/bugs/index";
import ReportsPage from "@/pages/reports/index";
import DocumentsPage from "@/pages/documents/index";
import ProfilePage from "@/pages/profile";
import UsersPage from "@/pages/users/index";
import SettingsPage from "@/pages/settings/index";
import TimeSheetsPage from "@/pages/timesheets/index";
import KanbanPage from "@/pages/kanban-page";
import TestUploadPage from "@/pages/test-upload";
import TraceabilityMatrixPage from "@/pages/traceability-matrix";
import FunctionalFlowPage from "@/pages/functional-flow/index";
import { Loader2 } from "lucide-react";
import TimesheetsPage from "@/pages/timesheets/index";
import NotebooksPage from "@/pages/notebooks/index";
import TodosPage from "./pages/todos";
import TestDataGeneratorPage from "./pages/test-data-generator";

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const LoadingComponent = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
    <p className="text-lg">Loading component...</p>
  </div>
);

// Helper to create protected routes
const ProtectedComponent = ({ Component }: { Component: ComponentType }) => (
  <ProtectedRoute>
    <Component />
  </ProtectedRoute>
);

// Helper to create protected routes with Suspense for lazy-loaded components
const ProtectedLazyComponent = ({ Component }: { Component: ComponentType }) => (
  <ProtectedRoute>
    <Suspense fallback={<LoadingComponent />}>
      <Component />
    </Suspense>
  </ProtectedRoute>
);

// Sound Integration Setup Component
function SoundIntegrationSetup() {
  useEffect(() => {
    console.log('🔊 Initializing sound integration...');

    // Check if sound manager is available
    if (window.soundManager) {
      console.log('✅ Sound manager is available');
      console.log('🔊 Sound settings:', window.soundManager.getSettings());
    } else {
      console.warn('⚠️ Sound manager not available, attempting to initialize...');

      // Try to dynamically import and initialize sound manager
      import('./lib/soundManager.js').then(() => {
        console.log('✅ Sound manager imported');
        if (window.soundManager) {
          console.log('🔊 Sound manager initialized with settings:', window.soundManager.getSettings());
        }
      }).catch(error => {
        console.error('❌ Failed to import sound manager:', error);
      });
    }

    // Initialize global sound handler
    if (window.globalSoundHandler) {
      console.log('✅ Global sound handler is available');
    } else {
      console.warn('⚠️ Global sound handler not available, attempting to initialize...');

      import('./lib/globalSoundHandler.js').then(() => {
        console.log('✅ Global sound handler imported');
      }).catch(error => {
        console.error('❌ Failed to import global sound handler:', error);
      });
    }

    // Add debug event listeners
    const debugClickHandler = (event: Event) => {
      console.log('🖱️ Click detected on:', event.target);
      if (window.soundManager) {
        window.soundManager.playClick().then(() => {
          console.log('🔊 Click sound played');
        }).catch(error => {
          console.error('❌ Failed to play click sound:', error);
        });
      }
    };

    // Add temporary debug listener
    document.addEventListener('click', debugClickHandler);

    return () => {
      document.removeEventListener('click', debugClickHandler);
    };
  }, []);

  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login}/>
      <Route path="/register" component={Register}/>
      <Route path="/forgot-password" component={ForgotPassword}/>
      <Route path="/reset-password" component={ResetPassword}/>

      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedComponent Component={Dashboard} />
      </Route>
      <Route path="/">
        <ProtectedComponent Component={Dashboard} />
      </Route>
      <Route path="/projects">
        <ProtectedComponent Component={ProjectsPage} />
      </Route>
      <Route path="/projects/:id">
        <ProtectedComponent Component={ProjectDetailPage} />
      </Route>
      <Route path="/projects/edit/:id">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/projects/edit/[id]"))} />
      </Route>
      <Route path="/modules">
        <ProtectedComponent Component={ModulesPage} />
      </Route>
      <Route path="/test-cases">
        <ProtectedComponent Component={TestCasesPage} />
      </Route>
      <Route path="/bugs">
        <ProtectedComponent Component={BugsPage} />
      </Route>
      <Route path="/bugs/:id">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/bugs/[id]"))} />
      </Route>
      <Route path="/reports">
        <ProtectedComponent Component={ReportsPage} />
      </Route>
      <Route path="/reports/consolidated">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/reports/consolidated"))} />
      </Route>
      <Route path="/documents">
        <ProtectedComponent Component={DocumentsPage} />
      </Route>
      <Route path="/profile">
        <ProtectedComponent Component={ProfilePage} />
      </Route>
      <Route path="/users">
        <ProtectedComponent Component={UsersPage} />
      </Route>
      <Route path="/settings">
        <ProtectedComponent Component={SettingsPage} />
      </Route>
      <Route path="/timesheets">
        <ProtectedComponent Component={TimeSheetsPage} />
      </Route>
      <Route path="/functional-flow">
        <ProtectedComponent Component={FunctionalFlowPage} />
      </Route>
      <Route path="/kanban">
        <ProtectedComponent Component={KanbanPage} />
      </Route>
      <Route path="/test-upload">
        <ProtectedComponent Component={TestUploadPage} />
      </Route>
      <Route path="/timesheets">
        <ProtectedComponent Component={TimeSheetsPage} />
      </Route>
      <Route path="/notebooks">
        <ProtectedComponent Component={NotebooksPage} />
      </Route>
      <Route path="/messenger">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/messenger/index"))} />
      </Route>
      <Route path="/todos">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/todos"))} />
      </Route>
      <Route path="/traceability-matrix">
        <ProtectedComponent Component={TraceabilityMatrixPage} />
      </Route>
      <Route path="/test-sheets">
         <ProtectedLazyComponent Component={lazy(() => import("./pages/test-sheets"))} />
      </Route>
      <Route path="/github">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/github"))} />
      </Route>
      <Route path="/test-data-generator">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/test-data-generator"))} />
      </Route>
      <Route path="/automation">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/automation"))} />
      </Route>

      {/* Catch-all 404 route - make sure this is last */}
      <Route path="/:rest*">
        <NotFound />
      </Route>
    </Switch>
  );
}

// Main App Content (everything that needs AuthProvider)
function AppContent() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <SoundIntegrationSetup />
          <Router />
          <GitHubIssueReporter />
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  // Initialize sound manager on app startup
  useEffect(() => {
    console.log('🚀 App starting up...');

    // Load sound manager script
    const loadSoundManager = async () => {
      try {
        console.log('🔊 Loading sound manager...');
        await import('./lib/soundManager.js');
        console.log('✅ Sound manager loaded');

        console.log('🔊 Loading global sound handler...');
        await import('./lib/globalSoundHandler.js');
        console.log('✅ Global sound handler loaded');

        // Wait a bit for initialization
        setTimeout(() => {
          if (window.soundManager) {
            console.log('🔊 Sound system ready with settings:', window.soundManager?.getSettings());

            // Check if user just logged in and show welcome dialog
            const showWelcome = localStorage.getItem('showWelcomeDialog');
            if (showWelcome === 'true') {
              localStorage.removeItem('showWelcomeDialog');
              // Show welcome dialog after a short delay
              setTimeout(() => {
                setShowWelcomeDialog(true);
              }, 1000);
            }
          } else {
            console.warn('⚠️ Sound manager still not available after initialization');
          }
        }, 100);

      } catch (error) {
        console.error('❌ Failed to load sound system:', error);
      }
    };

    loadSoundManager();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SoundProvider>
        <AppContent />

        {/* Welcome Dialog */}
        {showWelcomeDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome to TestCase Tracker!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You've successfully logged in. Get started by creating your first project or exploring the dashboard.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowWelcomeDialog(false);
                      window.location.href = '/projects';
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Create First Project
                  </button>
                  <button
                    onClick={() => setShowWelcomeDialog(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Explore Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SoundProvider>
    </QueryClientProvider>
  );
}

export default App;