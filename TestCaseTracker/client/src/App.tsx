import React, { lazy, ComponentType, Suspense, useEffect, useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { GitHubIssueReporter } from '@/components/ui/github-issue-reporter';
import { WelcomeDialog } from '@/components/ui/welcome-dialog';
import { ProtectedRoute } from "@/lib/protected-route";
import { SoundProvider } from '@/hooks/use-sound-provider';

import NotFound from "@/pages/not-found";
import { DashboardPage } from "./pages/dashboard/index";
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
import AIGeneratorPage from "./pages/ai-generator"; // Added AI Generator Page

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
    } else {
      console.warn('⚠️ Sound manager not available, attempting to initialize...');

      // Try to dynamically import and initialize sound manager
      import('./lib/soundManager.js').then(() => {
        console.log('✅ Sound manager imported');
        if (window.soundManager) {
          console.log('🔊 Sound manager initialized successfully');
        }
      }).catch(error => {
        console.error('❌ Failed to import sound manager:', error);
      });
    }

    // Initialize global sound handler
    if (window.globalSoundHandler) {
      console.log('✅ Global sound handler is available');
    } else {
      console.warn('⚠️ Global sound handler not available, will be initialized by sound manager');
    }
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
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/">
        <ProtectedComponent Component={DashboardPage} />
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
      <Route path="/ai-generator">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/ai-generator"))} />
      </Route>"))} />
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
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // Removed automatic welcome dialog trigger as it's now handled in login form

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
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  useEffect(() => {
    console.log('🚀 App starting up...');

    // Load sound manager
    const loadSoundManager = async () => {
      console.log('🔊 Loading sound manager...');
      try {
        await import('./lib/soundManager.js');
        console.log('✅ Sound manager loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load sound manager:', error);
      }
    };

    loadSoundManager();

    // Check for welcome dialog trigger
    const checkWelcomeDialog = () => {
      const shouldShowWelcome = sessionStorage.getItem('showWelcomeDialog');
      if (shouldShowWelcome === 'true') {
        setShowWelcomeDialog(true);
        sessionStorage.removeItem('showWelcomeDialog');
      }
    };

    checkWelcomeDialog();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showWelcomeDialog' && e.newValue === 'true') {
        setShowWelcomeDialog(true);
        sessionStorage.removeItem('showWelcomeDialog');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </QueryClientProvider>
  );
}

export default App;