
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CrudAnimation } from "@/components/ui/crud-animations";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCrudButtonProps {
  children: React.ReactNode;
  operation: "create" | "read" | "update" | "delete";
  onClick?: () => void | Promise<void>;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const AnimatedCrudButton: React.FC<AnimatedCrudButtonProps> = ({
  children,
  operation,
  onClick,
  className,
  disabled,
  variant = "default",
  size = "default"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleClick = async () => {
    if (!onClick || disabled) return;

    setIsLoading(true);
    try {
      await onClick();
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      setIsLoading(false);
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const getOperationColors = () => {
    switch (operation) {
      case "create":
        return "hover:bg-green-50 hover:border-green-200";
      case "read":
        return "hover:bg-blue-50 hover:border-blue-200";
      case "update":
        return "hover:bg-yellow-50 hover:border-yellow-200";
      case "delete":
        return "hover:bg-red-50 hover:border-red-200";
      default:
        return "";
    }
  };

  return (
    <motion.div className="relative inline-block">
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        variant={variant}
        size={size}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          getOperationColors(),
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <CrudAnimation type="loading" size="sm" />
              <span>Processing...</span>
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <CrudAnimation type="success" size="sm" />
              <span>Success!</span>
            </motion.div>
          ) : showError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <CrudAnimation type="error" size="sm" />
              <span>Error!</span>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <CrudAnimation type={operation} size="sm" />
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};
