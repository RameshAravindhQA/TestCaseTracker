import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { LoginForm } from '@/components/authentication/login-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { NavadhitiLogo } from "@/components/ui/navadhiti-logo";
import { loginPageVariants, loginHeaderVariants, logoVariants } from "@/lib/animations";

export default function LoginPage() {
  console.log("🔄 Rendering LoginPage");

  try {
    return (
      <motion.div
        variants={loginPageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-md w-full space-y-8">
          <motion.div
            variants={loginHeaderVariants}
            className="text-center"
          >
            <motion.div
              className="flex justify-center mb-6"
              variants={logoVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <NavadhitiLogo size="xl" />
            </motion.div>
            <motion.h2
              className="text-3xl font-bold text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.6, duration: 0.5 }
              }}
            >
              Test Case Management System
            </motion.h2>
          </motion.div>

          <LoginForm />
        </div>
      </motion.div>
    );
  } catch (error) {
    console.error("❌ Error rendering LoginPage:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Login Page Error</h1>
          <p className="text-gray-600">Please check the console for details.</p>
        </div>
      </div>
    );
  }
}