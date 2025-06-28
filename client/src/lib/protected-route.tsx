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
  });

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth) return;

    const isLocallyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    if (!isLoading) {
      // Check if user is authenticated (either via API or localStorage)
      const isAuthenticated = user || isLocallyAuthenticated;

      if (!isAuthenticated && location !== "/login") {
        console.log("Not authenticated, redirecting to login");
        navigate("/login");
        setHasCheckedAuth(true);
        setIsCheckingAuth(false);
        return;
      }

      if (isAuthenticated) {
        console.log("User authenticated:", user?.firstName || "User");
      }

      setHasCheckedAuth(true);
      setIsCheckingAuth(false);
    }
  }, [user, isLoading, location, navigate, hasCheckedAuth]);

  if (isCheckingAuth || isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}