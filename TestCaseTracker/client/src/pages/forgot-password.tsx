import { ForgotPasswordForm } from "@/components/authentication/forgot-password-form";
import { NavaDhitiLogo } from "@/components/ui/navadhiti-logo";
import { motion } from "framer-motion";
import { loginPageVariants, loginHeaderVariants } from "@/lib/animations";

export default function ForgotPasswordPage() {
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
          <div className="flex justify-center mb-6">
            <NavaDhitiLogo />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Test Case Management System
          </h2>
        </motion.div>

        <ForgotPasswordForm />
      </div>
    </motion.div>
  );
}