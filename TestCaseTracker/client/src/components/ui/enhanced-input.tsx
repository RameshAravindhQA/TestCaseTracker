
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { inputVariants } from '@/lib/animations';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
}

export function EnhancedInput({ 
  label, 
  error, 
  success, 
  icon, 
  className, 
  ...props 
}: EnhancedInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      variants={inputVariants}
      className="space-y-2"
    >
      {label && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Label htmlFor={props.id}>{label}</Label>
        </motion.div>
      )}
      
      <motion.div
        className="relative"
        whileFocus="focus"
        animate={isFocused ? "focus" : "blur"}
      >
        {icon && (
          <motion.div
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            animate={{ 
              color: isFocused ? '#3b82f6' : '#9ca3af',
              scale: isFocused ? 1.1 : 1 
            }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        )}
        
        <motion.div
          whileFocus={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.15 }}
        >
          <Input
            {...props}
            className={cn(
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-red-500 focus:border-red-500',
              success && 'border-green-500 focus:border-green-500',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
          />
        </motion.div>
        
        {/* Focus indicator */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: isFocused ? '100%' : 0 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
      
      {/* Error/Success message */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ 
          opacity: error || success ? 1 : 0, 
          y: error || success ? 0 : -5 
        }}
        transition={{ duration: 0.2 }}
        className="min-h-[1.25rem]"
      >
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
        {success && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-green-500"
          >
            Input is valid
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default EnhancedInput;
