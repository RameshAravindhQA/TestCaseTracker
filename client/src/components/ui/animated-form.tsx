
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formVariants, inputVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export function AnimatedForm({ children, className, onSubmit }: AnimatedFormProps) {
  return (
    <motion.form
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
      onSubmit={onSubmit}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={inputVariants}
          whileFocus="focus"
          whileTap="tap"
        >
          {child}
        </motion.div>
      ))}
    </motion.form>
  );
}

interface AnimatedFieldGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function AnimatedFieldGroup({ children, label, className }: AnimatedFieldGroupProps) {
  return (
    <motion.div
      variants={inputVariants}
      className={cn("space-y-2", className)}
    >
      {label && (
        <motion.label
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </motion.label>
      )}
      <motion.div
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default AnimatedForm;
