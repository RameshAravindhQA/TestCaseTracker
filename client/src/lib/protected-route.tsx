import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Check if already logged in via API
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (hasRedirected) return;

    const isLocallyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    if (!isLoading) {
      if (!user && !isLocallyAuthenticated && window.location.pathname !== "/login") {
        console.log("Not authenticated, redirecting to login");
        setHasRedirected(true);
        navigate("/login");
        return;
      }

      if (user || isLocallyAuthenticated) {
        console.log("User authenticated:", user?.firstName || "User");
      }

      setIsCheckingAuth(false);
    }
  }, [user, isLoading, navigate, hasRedirected]);

  if (isCheckingAuth || isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}