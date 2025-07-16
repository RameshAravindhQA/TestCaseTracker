
import React, { useEffect } from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { SoundProvider } from '@/hooks/use-sound-provider';
import { setupGlobalFetchInterceptor } from '@/lib/sound-api-integration';
import ProtectedRoute from '@/lib/protected-route';

// Pages
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import ForgotPasswordPage from '@/pages/forgot-password';
import ResetPasswordPage from '@/pages/reset-password';
import DashboardPage from '@/pages/dashboard';
import ProfilePage from '@/pages/profile';
import ProjectsPage from '@/pages/projects';
import ProjectDetailPage from '@/pages/projects/[id]';
import ProjectEditPage from '@/pages/projects/edit/[id]';
import TestCasesPage from '@/pages/test-cases';
import BugsPage from '@/pages/bugs';
import BugDetailPage from '@/pages/bugs/[id]';
import ReportsPage from '@/pages/reports';
import ConsolidatedReportsPage from '@/pages/reports/consolidated';
import SettingsPage from '@/pages/settings';
import UsersPage from '@/pages/users';
import ModulesPage from '@/pages/modules';
import DocumentsPage from '@/pages/documents';
import NotebooksPage from '@/pages/notebooks';
import TestSheetsPage from '@/pages/test-sheets';
import TimesheetsPage from '@/pages/timesheets';
import TodosPage from '@/pages/todos';
import PermissionsPage from '@/pages/permissions';
import KanbanPage from '@/pages/kanban';
import MessengerPage from '@/pages/messenger';
import FunctionalFlowPage from '@/pages/functional-flow';
import TraceabilityMatrixPage from '@/pages/traceability-matrix';
import TestDataGeneratorPage from '@/pages/test-data-generator';
import AutomationPage from '@/pages/automation';
import RecordPlaybackPage from '@/pages/automation/record-playback';
import GithubPage from '@/pages/github';
import AdminNotificationsPage from '@/pages/admin/notifications';
import NotFoundPage from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedComponent: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      {children}
    </ProtectedRoute>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Setup global fetch interceptor for API sound integration
    setupGlobalFetchInterceptor();
    
    // Setup error handling
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SoundProvider>
            <Router>
              <Switch>
                {/* Public Routes */}
                <Route path="/login" component={LoginPage} />
                <Route path="/register" component={RegisterPage} />
                <Route path="/forgot-password" component={ForgotPasswordPage} />
                <Route path="/reset-password" component={ResetPasswordPage} />

                {/* Protected Routes */}
                <Route path="/">
                  <ProtectedComponent>
                    <DashboardPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/dashboard">
                  <ProtectedComponent>
                    <DashboardPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/profile">
                  <ProtectedComponent>
                    <ProfilePage />
                  </ProtectedComponent>
                </Route>

                <Route path="/projects">
                  <ProtectedComponent>
                    <ProjectsPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/projects/:id">
                  {(params) => (
                    <ProtectedComponent>
                      <ProjectDetailPage />
                    </ProtectedComponent>
                  )}
                </Route>

                <Route path="/projects/edit/:id">
                  {(params) => (
                    <ProtectedComponent>
                      <ProjectEditPage />
                    </ProtectedComponent>
                  )}
                </Route>

                <Route path="/test-cases">
                  <ProtectedComponent>
                    <TestCasesPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/bugs">
                  <ProtectedComponent>
                    <BugsPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/bugs/:id">
                  {(params) => (
                    <ProtectedComponent>
                      <BugDetailPage />
                    </ProtectedComponent>
                  )}
                </Route>

                <Route path="/reports">
                  <ProtectedComponent>
                    <ReportsPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/reports/consolidated">
                  <ProtectedComponent>
                    <ConsolidatedReportsPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/settings">
                  <ProtectedComponent>
                    <SettingsPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/users">
                  <ProtectedComponent requiredRole="admin">
                    <UsersPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/modules">
                  <ProtectedComponent>
                    <ModulesPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/documents">
                  <ProtectedComponent>
                    <DocumentsPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/notebooks">
                  <ProtectedComponent>
                    <NotebooksPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/test-sheets">
                  <ProtectedComponent>
                    <TestSheetsPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/timesheets">
                  <ProtectedComponent>
                    <TimesheetsPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/todos">
                  <ProtectedComponent>
                    <TodosPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/permissions">
                  <ProtectedComponent requiredRole="admin">
                    <PermissionsPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/kanban">
                  <ProtectedComponent>
                    <KanbanPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/messenger">
                  <ProtectedComponent>
                    <MessengerPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/functional-flow">
                  <ProtectedComponent>
                    <FunctionalFlowPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/traceability-matrix">
                  <ProtectedComponent>
                    <TraceabilityMatrixPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/test-data-generator">
                  <ProtectedComponent>
                    <TestDataGeneratorPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/automation">
                  <ProtectedComponent>
                    <AutomationPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/automation/record-playback">
                  <ProtectedComponent>
                    <RecordPlaybackPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/github">
                  <ProtectedComponent>
                    <GithubPage />
                  </ProtectedComponent>
                </Route>

                <Route path="/admin/notifications">
                  <ProtectedComponent requiredRole="admin">
                    <AdminNotificationsPage />
                  </ProtectedComponent>
                </Route>

                {/* 404 Route */}
                <Route>
                  <NotFoundPage />
                </Route>
              </Switch>
            </Router>
            <Toaster />
          </SoundProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
