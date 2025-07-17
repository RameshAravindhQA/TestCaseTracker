import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/authentication/login-form";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import { motion } from "framer-motion";
import { loginPageVariants, loginFormVariants, loginHeaderVariants, curtainRevealVariants, pageTransitions, pageVariants } from "@/lib/animations";

export function LoginPage() {
  const [, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger content animation after component mount
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4"
    >
      {/* Background Animation Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full filter blur-3xl"
        style={{ transform: "translate(-20%, -20%)" }}
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
            className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-white font-bold text-xl"
            >
              TC
            </motion.span>
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

        {/* Login Form with Advanced Animation */}
        <motion.div
          variants={loginFormVariants}
          className="relative"
        >
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl">
            <CardHeader className="space-y-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <CardTitle className="text-2xl font-semibold text-center">
                  Welcome Back
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                <CardDescription className="text-center">
                  Sign in to your account to continue
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                <LoginForm />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="mt-6 text-center space-y-2"
              >
                <Link href="/forgot-password">
                  <motion.span
                    whileHover={{ scale: 1.05, color: "#3B82F6" }}
                    className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    Forgot your password?
                  </motion.span>
                </Link>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Link href="/register">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium cursor-pointer"
                    >
                      Sign up
                    </motion.span>
                  </Link>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

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
      </motion.div>
    </motion.div>
  );
}