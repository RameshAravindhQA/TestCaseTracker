import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // First check localStorage for a quicker response
  const isLocallyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Then verify with the server
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: fetchCurrentUser,
    // Don't refetch on window focus for auth checks
    refetchOnWindowFocus: false,
    // Reduce retries for auth check
    retry: 1,
    // Only run this query if localStorage indicates we might be authenticated
    enabled: isLocallyAuthenticated, 
  });

  useEffect(() => {
    const checkAuthentication = async () => {
      // If localStorage says we're not authenticated, redirect immediately (but check current location)
      if (!isLocallyAuthenticated && window.location.pathname !== "/login") {
        console.log("Not authenticated according to localStorage, redirecting to login");
        navigate("/login");
        setIsCheckingAuth(false);
        return;
      }

      // Wait for the query to complete
      if (!isLoading) {
        if (isError || !user) {
          console.log("User not authenticated, redirecting to login");
          // Clear localStorage auth flag since server says we're not authenticated
          localStorage.removeItem('isAuthenticated');
          navigate("/login");
        }
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [isLoading, isError, user, navigate, isLocallyAuthenticated]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
}