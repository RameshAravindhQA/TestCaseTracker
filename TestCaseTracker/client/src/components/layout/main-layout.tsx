import { ReactNode, useState, useEffect } from "react";
import { useLocation, useRouter } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Menu, X } from "lucide-react";
import { FrozenAvatar } from "@/components/ui/frozen-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalChatbot } from "@/components/chat/global-chatbot";
import { TodoToggleButton } from "@/components/todo/todo-toggle-button";
import { pageVariants, sidebarVariants, backdropVariants } from "@/lib/animations";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
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

  // If this is login, register, or forgot password page, render without sidebar
  if (location === "/login" || location === "/register" || location === "/forgot-password") {
    return <>{children}</>;
  }

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
        "flex-1 min-h-screen bg-gray-50 dark:bg-gray-950 transition-all duration-300 overflow-hidden overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-600",
        !isMobile ? "ml-60" : "pt-16"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full relative"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              initial={{ rotateY: -15, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 15, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Chatbot */}
      <GlobalChatbot />
      <div className="flex items-center gap-2">
            <TodoToggleButton />
            <GlobalChatbot />
            </div>
    </div>
  );
}