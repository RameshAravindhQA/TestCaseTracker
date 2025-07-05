import { lazy, ComponentType, Suspense } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
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
import { GlobalIssueToggle } from "@/components/global/global-issue-toggle";
import TestSheetsPage from "@/pages/test-sheets";
import OnlyOfficePage from "@/pages/onlyoffice";

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
      <Route path="/enhanced-messenger">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/enhanced-messenger"))} />
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
      <Route path="/onlyoffice">
         <ProtectedLazyComponent Component={lazy(() => import("./pages/onlyoffice"))} />
      </Route>

      <Route path="/github">
        <ProtectedLazyComponent Component={lazy(() => import("./pages/github"))} />
      </Route>

      {/* Catch-all 404 route - make sure this is last */}
      <Route path="/:rest*">
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" defaultColorTheme="blue">
        <AuthProvider>
          <TooltipProvider>
            <GlobalIssueToggle />
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;