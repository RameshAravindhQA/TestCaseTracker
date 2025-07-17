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
import { motion } from "framer-motion";
import { GlobalChatbot } from "@/components/chat/global-chatbot";
import { TodoToggleButton } from "@/components/todo/todo-toggle-button";

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

    // Redirect to login if not authenticated
    if (!isLoading && !user && !isAuthenticated && 
        location !== "/login" && 
        location !== "/register" && 
        location !== "/forgot-password") {
      console.log("User not authenticated, redirecting to login");
      navigate("/login");
    }
  }, [user, isLoading, location, navigate]);

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
    <div className="flex h-screen overflow-hidden">
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
      {isMobile && menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 transition-opacity"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform dark:shadow-gray-900/80",
              menuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                className="dark:text-gray-300"
              >
                <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1 bg-gray-50 dark:bg-gray-950 p-0 m-0 text-gray-900 dark:text-white overflow-auto",
        isMobile ? "pt-20" : "ml-60" // Adjusted for the new 60px sidebar width
      )}>
        {children}
        <TodoToggleButton />
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