import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [location, navigate] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check if already logged in via API
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    // Don't run authentication check if already checked or still loading
    if (hasCheckedAuth || isLoading) return;

    const isLocallyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // If we have a 401 error or no user and no local auth, redirect to login
    if (error?.message === "Not authenticated" || (!user && !isLocallyAuthenticated)) {
      console.log("Not authenticated, redirecting to login");
      // Clear any problematic localStorage data that might cause issues
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('hasSeenWelcome');
      localStorage.removeItem('hasCompletedOnboarding');
      localStorage.removeItem('showMotivationDialog');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginTime');
      
      if (location !== "/login") {
        navigate("/login");
      }
    } else if (user || isLocallyAuthenticated) {
      console.log("User authenticated:", user?.firstName || "User");
    }

    setHasCheckedAuth(true);
    setIsCheckingAuth(false);
  }, [user, isLoading, error, location, navigate, hasCheckedAuth]);

  if (isCheckingAuth || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>;
  }

  // If we're on the login page, always render
  if (location === "/login") {
    return <>{children}</>;
  }

  // For other pages, check if user is authenticated
  const isLocallyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!user && !isLocallyAuthenticated) {
    return null; // This should not happen due to redirect logic above
  }

  return <>{children}</>;
}