
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  tooltip?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white'
};

const sizeStyles = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14'
};

export function FloatingActionButton({
  icon: Icon,
  onClick,
  className,
  tooltip,
  variant = 'primary',
  size = 'md'
}: FloatingActionButtonProps) {
  return (
    <motion.div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      <Button
        onClick={onClick}
        className={cn(
          "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
          variantStyles[variant],
          sizeStyles[size]
        )}
        title={tooltip}
      >
        <motion.div
          whileHover={{ rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </Button>
      
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-blue-400"
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
    </motion.div>
  );
}

export default FloatingActionButton;
