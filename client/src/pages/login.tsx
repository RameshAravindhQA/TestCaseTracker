import { LoginForm } from "@/components/authentication/login-form";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Login() {
  const [, navigate] = useLocation();
  
  // Check if already logged in via API
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
  });
  
  // Check if already logged in and redirect to dashboard
  useEffect(() => {
    // Only redirect if we have confirmed user data from API (not just localStorage)
    if (!isLoading && user) {
      console.log("User already authenticated, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);
  
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