
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
            {/* Professional NavaDhiti Logo */}
            <div className="relative">
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-2xl"
              >
                <defs>
                  <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="50%" stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#1E3A8A" />
                  </linearGradient>
                  <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Main background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="url(#mainGradient)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#glow)"
                />
                
                {/* Inner circle for depth */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
                
                {/* Stylized 'N' with modern design */}
                <g fill="white">
                  <path
                    d="M25 30 L25 70 L32 70 L32 45 L48 70 L55 70 L55 30 L48 30 L48 55 L32 30 Z"
                    fill="white"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="0.5"
                  />
                </g>
                
                {/* Test tube/beaker icon representing testing */}
                <g fill="url(#accentGradient)">
                  <path d="M65 30 L65 35 L70 45 Q72 47 70 49 L62 49 Q60 47 62 45 L67 35 L67 30 Z" />
                  <circle cx="66" cy="32" r="1.5" fill="white" opacity="0.8"/>
                </g>
                
                {/* Geometric elements for modern tech feel */}
                <g fill="rgba(255,255,255,0.3)">
                  <polygon points="75,25 80,30 75,35" />
                  <polygon points="20,65 25,70 20,75" />
                </g>
                
                {/* Data/network nodes */}
                <g fill="url(#accentGradient)">
                  <circle cx="75" cy="65" r="2" opacity="0.8"/>
                  <circle cx="25" cy="35" r="2" opacity="0.6"/>
                  <circle cx="80" cy="45" r="1.5" opacity="0.4"/>
                </g>
                
                {/* Connecting lines for network effect */}
                <g stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" fill="none">
                  <line x1="75" y1="65" x2="80" y2="45" />
                  <line x1="25" y1="35" x2="32" y2="30" />
                </g>
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
