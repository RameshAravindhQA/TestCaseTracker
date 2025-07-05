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
    onSuccess: (data) => {
      console.log('🔒 PROTECTED ROUTE AUTH SUCCESS:', data ? 'User found' : 'No user');
    },
    onError: (error) => {
      console.log('🔒 PROTECTED ROUTE AUTH ERROR:', error.message);
    }
  });

  useEffect(() => {
    console.log('🔒 PROTECTED ROUTE CHECK:', {
      location,
      user: user ? { id: user.id, email: user.email } : null,
      isLoading,
      hasCheckedAuth,
      localStorage: {
        auth: localStorage.getItem('isAuthenticated'),
        user: localStorage.getItem('user') ? 'present' : 'none'
      }
    });

    // Don't run authentication check if already checked or still loading
    if (hasCheckedAuth || isLoading) {
      console.log('🔒 PROTECTED ROUTE: Skipping check - already checked or loading');
      return;
    }

    const isLocallyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const storedUser = localStorage.getItem('user');
    const isAuthenticated = user || (isLocallyAuthenticated && storedUser);

    console.log('🔒 PROTECTED ROUTE AUTH STATE:', {
      isAuthenticated,
      user: !!user,
      isLocallyAuthenticated,
      storedUser: !!storedUser,
      location
    });

    // Only redirect if we're not on login page and not authenticated
    if (!isAuthenticated && location !== "/login") {
      console.log("❌ PROTECTED ROUTE: Not authenticated, redirecting to login");
      navigate("/login");
    } else if (isAuthenticated) {
      console.log("✅ PROTECTED ROUTE: User authenticated:", user?.firstName || storedUser ? 'Stored User' : "User");
    }

    setHasCheckedAuth(true);
    setIsCheckingAuth(false);
  }, [user, isLoading, location, navigate, hasCheckedAuth]);

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