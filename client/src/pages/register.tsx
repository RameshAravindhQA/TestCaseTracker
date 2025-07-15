import { RegisterForm } from "@/components/authentication/register-form";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EnhancedLottie } from "@/components/ui/enhanced-lottie";
import { playSound } from "@/utils/sound-effects";

export default function Register() {
  const [, navigate] = useLocation();
  const [hasChecked, setHasChecked] = useState(false);

  // Check if already logged in via API
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      return response.json();
    },
    retry: false,
    throwOnError: false,
    enabled: !hasChecked,
  });

  // Handle query errors gracefully
  useEffect(() => {
    if (error) {
      console.log("Auth check error (expected if not logged in):", error);
    }
  }, [error]);

  // Check localStorage for auth status and redirect to dashboard if authenticated
  useEffect(() => {
    if (hasChecked) return;

    const isAuthenticatedInLocalStorage =
      localStorage.getItem("isAuthenticated") === "true";

    if (!isLoading) {
      if (user && isAuthenticatedInLocalStorage) {
        console.log("User already authenticated, redirecting to dashboard");
        navigate("/dashboard");
      }
      setHasChecked(true);
    }
  }, [user, isLoading, navigate, hasChecked]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 px-4 overflow-hidden">
      {/* Animated Rocket Man */}
      <motion.div 
        className="absolute left-4 lg:left-10 top-1/2 transform -translate-y-1/2 z-10 hidden lg:block"
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ willChange: 'transform' }}
        onAnimationComplete={() => playSound('info')}
      >
        <div className="w-64 h-64 lg:w-80 lg:h-80">
          <EnhancedLottie
            customUrl="/attached_assets/Rocket lottie Animation_1752294834959.json"
            size="2xl"
            loop={true}
            autoplay={true}
            className="w-full h-full object-contain scale-150"
          />
        </div>
      </motion.div>

      <div className="w-full max-w-lg p-8 space-y-8 z-20 relative">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="relative p-4 bg-white rounded-full shadow-lg">
            <img
              src="/images/navadhiti-logo-tree.jpg"
              alt="Logo"
              className="w-24 h-24 object-contain mx-auto rounded-full transition-all duration-300"
              style={{ willChange: 'transform' }}
            />
          </div>
          <h1 className="text-3xl font-bold text-black">
            <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Test Case Management System
            </span>
          </h1>
        </div>

        <div className={`flex flex-col space-y-4 transition-opacity duration-500`}>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}