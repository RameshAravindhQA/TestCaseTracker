import { RegisterForm } from "@/components/authentication/register-form";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Register() {
  const [, navigate] = useLocation();
  
  // Check if already logged in
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
  });
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <img 
              src="/images/navadhiti-logo-tree.jpg" 
              alt="NavaDhiti Logo" 
              className="h-auto w-64 mx-auto mb-4" 
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign up to the TestTrack platform
          </p>
        </div>
        
        <RegisterForm />
      </div>
    </div>
  );
}
