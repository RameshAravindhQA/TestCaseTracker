import { RegisterForm } from "@/components/authentication/register-form";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { loginPageVariants, loginFormVariants, loginHeaderVariants, curtainRevealVariants } from "@/lib/animations";

function Register() {
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
        className="absolute top-10 right-10 w-20 h-20 bg-green-400/20 rounded-full blur-xl"
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
        className="absolute bottom-10 left-10 w-16 h-16 bg-blue-400/20 rounded-full blur-xl"
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
            {/* NavaDhiti Logo */}
            <div className="relative">
              <img
                src="/images/navadhiti-logo-tree.jpg"
                alt="NavaDhiti Logo"
                className="h-32 w-32 rounded-full shadow-lg border-4 border-white dark:border-gray-800"
              />
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
            className="text-gray-600 dark:text-gray-300 font-bold"
          >
            Create Your Account
          </motion.p>
        </motion.div>

        {/* Register Form */}
        <motion.div
          variants={loginFormVariants}
          className="relative"
        >
          <RegisterForm />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Register;