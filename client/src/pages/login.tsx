import { LoginForm } from "@/components/authentication/login-form";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EnhancedLottie } from "@/components/ui/enhanced-lottie";
import { WelcomeDialog } from "@/components/ui/welcome-dialog";
import { playSound } from "@/utils/sound-effects";

export default function Login() {
  const [, navigate] = useLocation();
  const [hasChecked, setHasChecked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check if already logged in via API
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: 'include',
        });
        if (response.status === 401) {
          return null;
        }
        if (!response.ok) {
          throw new Error('Auth check failed');
        }
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
    throwOnError: false,
    enabled: !hasChecked, // Only check once
  });

  // Handle query errors gracefully
  useEffect(() => {
    if (error) {
      console.log("Auth check error (expected if not logged in):", error);
    }
  }, [error]);

  // Check localStorage for auth status and show welcome dialog or redirect
  useEffect(() => {
    if (hasChecked) return;

    // Check both API response and localStorage for authentication status
    const isAuthenticatedInLocalStorage =
      localStorage.getItem("isAuthenticated") === "true";
    const justLoggedIn = localStorage.getItem("justLoggedIn") === "true";

    if (!isLoading) {
      if (user && isAuthenticatedInLocalStorage) {
        if (justLoggedIn) {
          // Show welcome dialog for new login
          setCurrentUser(user);
          setShowWelcome(true);
          localStorage.removeItem("justLoggedIn"); // Remove flag
        } else {
          // Direct redirect for returning sessions
          console.log("User already authenticated, redirecting to dashboard");
          navigate("/dashboard");
        }
      }
      setHasChecked(true);
    }
  }, [user, isLoading, navigate, hasChecked]);

  // Listen for login success events
  useEffect(() => {
    const handleLoginSuccess = (event: CustomEvent) => {
      console.log("Login success event received", event.detail);
      setCurrentUser(event.detail.user);
      setShowWelcome(true);
      // Play login sound
      playSound('login');
    };

    window.addEventListener('loginSuccess', handleLoginSuccess as EventListener);

    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess as EventListener);
    };
  }, []);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    // Navigate to dashboard after welcome dialog closes
    setTimeout(() => {
      navigate("/dashboard");
    }, 100);
  };

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
            customUrl="/lottie/Rocket lottie Animation_1752294834959.json"
            size="2xl"
            loop={true}
            autoplay={true}
            className="w-full h-full object-contain"
          />
        </div>
      </motion.div>

      <div className="w-full max-w-lg p-8 space-y-8 z-20 relative">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="relative p-4 bg-white rounded-full shadow-lg">
            <img
              src="/images/navadhiti-logo-tree.jpg"
              alt="Logo"
              className="w-24 h-24 object-contain mx-auto transition-all duration-300"
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
          <LoginForm />
        </div>
      </div>

      {/* Welcome Dialog */}
      <WelcomeDialog 
        isOpen={showWelcome}
        onClose={handleWelcomeClose}
        userName={currentUser?.username || currentUser?.email || "User"}
      />
    </div>
  );
}