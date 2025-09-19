import { ReactNode, useState, useEffect, useRef } from "react";
import { useLocation, useRouter } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Menu, X, ChevronUp, ChevronDown } from "lucide-react";
import { FrozenAvatar } from "@/components/ui/frozen-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { motion, AnimatePresence } from "framer-motion";
import { TodoToggleButton } from "@/components/todo/todo-toggle-button";
import { pageVariants, sidebarVariants, backdropVariants } from "@/lib/animations";
import {
  Bell,
  Settings,
  User,
  Search,
  Plus,
  Home,
  ChevronRight,
  MessageSquare,
  Users,
  FolderKanban,
  CheckSquare,
  BugPlay,
  FileBarChart,
  FileText,
  Clock,
  Trello,
  Github,
  Sparkles,
  BoxSelect,
  FormInput,
  ListFilter,
  Play,
  Terminal,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { ProjectChat } from "@/components/chat/project-chat";
import { GlobalChatbot } from "@/components/chat/global-chatbot";
import { IntelligentHelperBot } from "@/components/chat/intelligent-helper-bot";
import { useAuth } from "@/hooks/use-auth";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const [location, navigate] = useLocation();
  const isMobile = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  // Query to check if user is logged in
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
  });

  // Check local storage for authentication state
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    // Redirect to login if not authenticated or if we have an error
    if (!isLoading && (!user || error?.message === "Not authenticated") && !isAuthenticated &&
        location !== "/login" &&
        location !== "/register" &&
        location !== "/forgot-password") {
      console.log("User not authenticated, redirecting to login");
      // Clear invalid auth state
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginTime');
      navigate("/login");
    }
  }, [user, isLoading, error, location, navigate]);

  // Show loading state if checking auth
  if (isLoading && location !== "/login" && location !== "/register" && location !== "/forgot-password") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If this is login, register, forgot password, or reset password page, render without sidebar
  if (location === "/login" || location === "/register" || location === "/forgot-password" || location === "/reset-password") {
    return <>{children}</>;
  }

  const getPageIcon = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return <Home className="h-5 w-5" />;
    if (pathname.startsWith('/projects')) return <FolderKanban className="h-5 w-5" />;
    if (pathname.startsWith('/kanban')) return <Trello className="h-5 w-5" />;
    if (pathname.startsWith('/test-cases')) return <CheckSquare className="h-5 w-5" />;
    if (pathname.startsWith('/ai-generator')) return <Sparkles className="h-5 w-5" />;
    if (pathname.startsWith('/bugs')) return <BugPlay className="h-5 w-5" />;
    if (pathname.startsWith('/messenger')) return <Terminal className="h-5 w-5" />;
    if (pathname.startsWith('/github')) return <Github className="h-5 w-5" />;
    if (pathname.startsWith('/functional-flow')) return <BoxSelect className="h-5 w-5" />;
    if (pathname.startsWith('/timesheets')) return <Clock className="h-5 w-5" />;
    if (pathname.startsWith('/documents')) return <FileText className="h-5 w-5" />;
    if (pathname.startsWith('/reports')) return <FileBarChart className="h-5 w-5" />;
    if (pathname.startsWith('/test-sheets')) return <FormInput className="h-5 w-5" />;
    if (pathname.startsWith('/traceability-matrix')) return <ListFilter className="h-5 w-5" />;
    if (pathname.startsWith('/notebooks')) return <FileText className="h-5 w-5" />;
    if (pathname.startsWith('/todos')) return <CheckSquare className="h-5 w-5" />;
    if (pathname.startsWith('/automation')) return <Play className="h-5 w-5" />;
    if (pathname.startsWith('/employees')) return <UserCheck className="h-5 w-5" />;
    if (pathname.startsWith('/navadhiti-projects')) return <Briefcase className="h-5 w-5" />;
    if (pathname.startsWith('/users')) return <Users className="h-5 w-5" />;
    if (pathname.startsWith('/settings')) return <Settings className="h-5 w-5" />;
    if (pathname.startsWith('/profile')) return <User className="h-5 w-5" />;
    return <Home className="h-5 w-5" />;
  };

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/kanban')) return 'Kanban Board';
    if (pathname.startsWith('/test-cases')) return 'Test Cases';
    if (pathname.startsWith('/ai-generator')) return 'AI Generator';
    if (pathname.startsWith('/bugs')) return 'Bug Reports';
    if (pathname.startsWith('/messenger')) return 'Messenger';
    if (pathname.startsWith('/github')) return 'GitHub Integration';
    if (pathname.startsWith('/functional-flow')) return 'Functional Flow';
    if (pathname.startsWith('/timesheets')) return 'Timesheets';
    if (pathname.startsWith('/documents')) return 'Documents';
    if (pathname.startsWith('/reports')) return 'Reports';
    if (pathname.startsWith('/test-sheets')) return 'Test Sheets';
    if (pathname.startsWith('/traceability-matrix')) return 'Traceability Matrix';
    if (pathname.startsWith('/notebooks')) return 'Notebooks';
    if (pathname.startsWith('/todos')) return 'Todo List';
    if (pathname.startsWith('/automation')) return 'Test Automation';
    if (pathname.startsWith('/employees')) return 'Catalyst Management';
    if (pathname.startsWith('/navadhiti-projects')) return 'Navadhiti Projects';
    if (pathname.startsWith('/users')) return 'User Management';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/profile')) return 'My Profile';
    return 'NavaDhiti';
  };

  // ScrollIndicators component for global scroll management
  function ScrollIndicators() {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
      const handleScroll = () => {
        const scrollContainer = document.querySelector('main > div');
        if (scrollContainer) {
          const scrollTop = scrollContainer.scrollTop;
          const scrollHeight = scrollContainer.scrollHeight;
          const clientHeight = scrollContainer.clientHeight;
          const scrollableHeight = scrollHeight - clientHeight;

          // Calculate scroll progress
          const progress = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;
          setScrollProgress(progress);

          // Show/hide scroll buttons
          setShowScrollTop(scrollTop > 100);
          setShowScrollDown(scrollTop < scrollableHeight - 100);
        }
      };

      const scrollContainer = document.querySelector('main > div');
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
      }
    }, [location]);

    const scrollToTop = () => {
      const scrollContainer = document.querySelector('main > div');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };

    const scrollToBottom = () => {
      const scrollContainer = document.querySelector('main > div');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    return (
      <>
        {/* Scroll Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-30">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Scroll Indicators */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-20 right-6 z-20 rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
            size="icon"
          >
            <ChevronUp className="h-6 w-6" />
          </Button>
        )}

        {showScrollDown && (
          <Button
            onClick={scrollToBottom}
            className="fixed bottom-6 right-6 z-20 rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
            size="icon"
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
        )}
      </>
    );
  }

  // Logic to determine if project chat should be shown (example: on project-related pages)
  const shouldShowProjectChat = location.startsWith('/projects') || location.startsWith('/kanban');
  const currentProjectId = location.split('/').pop(); // Simple extraction, might need refinement

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar for desktop - kept simple with no special key */}
      {!isMobile && <Sidebar />}

      {/* Mobile header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(true)}
                className="dark:text-gray-300"
              >
                <Menu className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                <span className="sr-only">Open menu</span>
              </Button>
              <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">NavaDhiti</span>
            </div>

            {/* Display avatar in mobile header too */}
            <div className="flex items-center">
              <FrozenAvatar
                user={user}
                className="h-8 w-8"
                fallbackClassName="bg-gradient-to-br from-primary/80 to-primary/40"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl dark:shadow-gray-900/80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end p-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMenuOpen(false)}
                    className="dark:text-gray-300"
                  >
                    <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </motion.div>
              </div>
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={cn(
        "flex-1 min-h-screen bg-gray-50 dark:bg-gray-950 transition-all duration-300 relative",
        !isMobile ? "ml-60" : "pt-16"
      )}>
        <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-600 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full min-h-full relative"
              style={{ perspective: "1000px" }}
            >
              <motion.div
                initial={{ rotateY: -15, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 15, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="w-full min-h-full"
              >
                {children}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Scroll Indicators */}
        <ScrollIndicators />

        {/* Intelligent Helper Bot */}
      <IntelligentHelperBot />

      {/* Global Chat */}
      <GlobalChatbot />

      {/* Project Chat - Only show on specific pages */}
      {shouldShowProjectChat && currentProjectId && (
        <ProjectChat 
          projectId={currentProjectId} 
          currentUser={user}
        />
      )}
      </main>

      {/* This div contains the TodoToggleButton and was not part of the original issue regarding the floating icon. */}
      <div className="flex items-center gap-2">
            <TodoToggleButton />
            </div>
    </div>
  );
}

export default MainLayout;
export { MainLayout };