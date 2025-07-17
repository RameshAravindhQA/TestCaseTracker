import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/authentication/login-form";
import { NavaDhitiLogo } from "@/components/ui/navadhiti-logo";
import { motion } from "framer-motion";
import { loginPageVariants, loginFormVariants, loginHeaderVariants, authFormSlideVariants, glassVariants } from "@/lib/animations";
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
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden"
      variants={loginPageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-indigo-400/20 to-purple-400/20"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />

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
        variants={glassVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
      >
        <Card className="w-full shadow-none border-0 bg-transparent">
          <motion.div
            variants={loginHeaderVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CardHeader className="space-y-1 text-center pb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
                animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="text-white text-2xl font-bold"
                >
                  T
                </motion.div>
              </motion.div>
              <CardTitle className="text-2xl font-bold text-gray-800">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to your Test Case Tracker account
              </CardDescription>
            </CardHeader>
          </motion.div>

          <motion.div
            variants={authFormSlideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CardContent className="backdrop-blur-sm bg-white/5 rounded-xl">
              <LoginForm />
            </CardContent>
          </motion.div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default LoginPage;