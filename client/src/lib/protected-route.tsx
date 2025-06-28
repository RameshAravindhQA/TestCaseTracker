
import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const hasNavigatedRef = useRef(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Check localStorage for initial auth state
  const isLocallyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Only query if localStorage indicates authentication
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: fetchCurrentUser,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: isLocallyAuthenticated && !hasNavigatedRef.current,
  });

  useEffect(() => {
    // Prevent multiple executions
    if (hasNavigatedRef.current || authCheckComplete) return;

    // If not authenticated locally, redirect immediately
    if (!isLocallyAuthenticated) {
      console.log("Not authenticated according to localStorage, redirecting to login");
      hasNavigatedRef.current = true;
      navigate("/login");
      return;
    }

    // Wait for the query to complete before making decisions
    if (isLoading) return;

    // If query is complete and user is not authenticated
    if (isLocallyAuthenticated && (isError || !user)) {
      console.log("User not authenticated by server, redirecting to login");
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginTime');
      hasNavigatedRef.current = true;
      navigate("/login");
      return;
    }

    // If we reach here, authentication is successful
    if (user && isLocallyAuthenticated) {
      setAuthCheckComplete(true);
    }
  }, [isLocallyAuthenticated, isLoading, isError, user, navigate, authCheckComplete]);

  // Show loading state while checking authentication
  if (!authCheckComplete && !hasNavigatedRef.current) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we've navigated away, show loading
  if (hasNavigatedRef.current) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated and auth check is complete, render children
  return <>{children}</>;
}
