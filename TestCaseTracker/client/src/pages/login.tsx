
import { LoginForm } from "@/components/authentication/login-form";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Login() {
  const [, navigate] = useLocation();
  const [hasChecked, setHasChecked] = useState(false);
  
  // Check if already logged in via API
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
    enabled: !hasChecked, // Only check once
  });
  
  // Check localStorage for auth status and redirect to dashboard if authenticated
  useEffect(() => {
    if (hasChecked) return;

    // Check both API response and localStorage for authentication status
    const isAuthenticatedInLocalStorage = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!isLoading) {
      if (user && isAuthenticatedInLocalStorage) {
        console.log("User already authenticated, redirecting to dashboard");
        navigate("/dashboard");
      } else {
        console.log("Not authenticated, showing login form");
        // Clear any stale authentication data
        if (!user) {
          localStorage.removeItem('isAuthenticated');
        }
      }
      setHasChecked(true);
    }
  }, [user, isLoading, navigate, hasChecked]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="container p-6 space-y-8 max-w-md">
        <div className="flex flex-col space-y-2 text-center">
          <img 
            src="/images/navadhiti-logo-tree.jpg" 
            alt="NavaDhiti Logo" 
            className="h-auto w-64 mx-auto mb-4" 
          />
        </div>

        <div className="flex flex-col space-y-4">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
