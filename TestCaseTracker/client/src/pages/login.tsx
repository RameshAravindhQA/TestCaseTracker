import { LoginForm } from "@/components/authentication/login-form";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Login() {
  const [, navigate] = useLocation();

  // Check if already logged in via localStorage only to avoid API call issues
  useEffect(() => {
    const isAuthenticatedInLocalStorage = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticatedInLocalStorage) {
      console.log("User already authenticated, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="container p-6 space-y-8 max-w-md">
        <div className="flex flex-col space-y-2 text-center">
          <div className="animate-bounce">
            <img 
              src="/images/navadhiti-logo-tree.jpg" 
              alt="NavaDhiti Logo" 
              className="h-auto w-64 mx-auto mb-4" 
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Test Case Management System
          </h1>
        </div>

        <div className="flex flex-col space-y-4">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}