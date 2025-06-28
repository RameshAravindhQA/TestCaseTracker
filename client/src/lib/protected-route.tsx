
import { ReactNode, useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  const redirectedRef = useRef(false);

  // Check localStorage for initial auth state
  const isLocallyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Only query if localStorage indicates authentication
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: fetchCurrentUser,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: isLocallyAuthenticated && !hasRedirected && !redirectedRef.current,
  });

  useEffect(() => {
    // Prevent multiple redirections
    if (redirectedRef.current || hasRedirected) return;

    // If not authenticated locally, redirect immediately
    if (!isLocallyAuthenticated) {
      console.log("Not authenticated according to localStorage, redirecting to login");
      redirectedRef.current = true;
      setHasRedirected(true);
      navigate("/login");
      return;
    }

    // If query is complete and user is not authenticated
    if (!isLoading && isLocallyAuthenticated && (isError || !user)) {
      console.log("User not authenticated by server, redirecting to login");
      localStorage.removeItem('isAuthenticated');
      redirectedRef.current = true;
      setHasRedirected(true);
      navigate("/login");
    }
  }, [isLocallyAuthenticated, isLoading, isError, user]);

  // Show loading state while checking authentication
  if (!redirectedRef.current && !hasRedirected && (isLoading || !isLocallyAuthenticated)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we've redirected, don't render anything
  if (hasRedirected || redirectedRef.current) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated and no redirect, render children
  return <>{children}</>;
}
