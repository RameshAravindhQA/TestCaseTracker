import { ForgotPasswordForm } from "@/components/authentication/forgot-password-form";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

function ForgotPassword() {
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <motion.div
          variants={loginHeaderVariants}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15 
            }}
            className="flex justify-center mb-6"
          >
            {/* Custom NavaDhiti Logo */}
            <div className="relative">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
              >
                {/* Background circle with gradient */}
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#1E40AF" />
                  </linearGradient>
                  <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                
                {/* Main circle background */}
                <circle
                  cx="40"
                  cy="40"
                  r="38"
                  fill="url(#logoGradient)"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                
                {/* Letter 'N' stylized */}
                <path
                  d="M20 25 L20 55 L25 55 L25 35 L35 55 L40 55 L40 25 L35 25 L35 45 L25 25 Z"
                  fill="white"
                  fontWeight="bold"
                />
                
                {/* Decorative leaf/branch element */}
                <path
                  d="M50 30 Q55 25 60 30 Q55 35 50 30 Z"
                  fill="url(#leafGradient)"
                />
                <path
                  d="M52 32 Q57 37 62 32 Q57 42 52 37 Z"
                  fill="url(#leafGradient)"
                />
                
                {/* Small dots for tech feel */}
                <circle cx="48" cy="48" r="2" fill="white" opacity="0.8"/>
                <circle cx="54" cy="52" r="1.5" fill="white" opacity="0.6"/>
                <circle cx="58" cy="46" r="1" fill="white" opacity="0.4"/>
              </svg>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            NavaDhiti
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-gray-600 dark:text-gray-300"
          >
            Reset Your Password
          </motion.p>
        </motion.div>

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{" "}
                <Link href="/login">
                  <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium cursor-pointer">
                    Sign in
                  </span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

export default ForgotPassword;