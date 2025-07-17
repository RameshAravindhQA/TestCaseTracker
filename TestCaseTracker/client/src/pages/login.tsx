
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/authentication/login-form";
import { motion } from "framer-motion";
import { loginPageVariants, loginFormVariants, loginHeaderVariants, curtainRevealVariants } from "@/lib/animations";
import { useQuery } from "@tanstack/react-query";

function LoginPage() {
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
      variants={loginPageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Floating Animation Elements */}
      <motion.div
        animate={{
          y: [-10, 10, -10],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-10 right-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"
      />

      <motion.div
        animate={{
          y: [10, -10, 10],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-10 left-10 w-16 h-16 bg-purple-400/20 rounded-full blur-xl"
      />

      <motion.div
        variants={curtainRevealVariants}
        className="w-full max-w-md"
      >
        {/* Logo/Header Animation */}
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
            Test Case Management System
          </motion.p>
        </motion.div>

        {/* Single Login Form */}
        <motion.div
          variants={loginFormVariants}
          className="relative"
        >
          <LoginForm />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default LoginPage;
