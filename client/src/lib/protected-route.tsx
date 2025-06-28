import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [location, navigate] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if already logged in via API
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (isLoading) return;

    const isLocallyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    // If we have a user from API, we're authenticated
    if (user) {
      console.log("User authenticated via API:", user.firstName || user.email);
      setIsCheckingAuth(false);
      return;
    }

    // If API returned an error but we have local auth, try to stay authenticated
    if (error && isLocallyAuthenticated) {
      console.log("API auth failed but localStorage indicates authentication");
      // Clear localStorage and redirect to login
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginTime');
      
      if (location !== "/login") {
        console.log("Clearing invalid session, redirecting to login");
        navigate("/login");
      }
      setIsCheckingAuth(false);
      return;
    }

    // If not authenticated and not on login page, redirect
    if (!user && !isLocallyAuthenticated && location !== "/login") {
      console.log("Not authenticated, redirecting to login");
      navigate("/login");
      setIsCheckingAuth(false);
      return;
    }

    setIsCheckingAuth(false);
  }, [user, isLoading, error, location, navigate]);

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
  if (!user) {
    return null; // This should not happen due to redirect logic above
  }

  return <>{children}</>;
}