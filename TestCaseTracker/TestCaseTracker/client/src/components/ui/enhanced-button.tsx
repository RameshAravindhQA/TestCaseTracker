
import React from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { buttonVariants } from '@/lib/animations';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function EnhancedButton({
  children,
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: EnhancedButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.div
      variants={buttonVariants}
      initial="idle"
      whileHover={!isDisabled ? "hover" : "idle"}
      whileTap={!isDisabled ? "tap" : "idle"}
      animate={loading ? "loading" : "idle"}
    >
      <Button
        {...props}
        disabled={isDisabled}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          className
        )}
      >
        <motion.div
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 1 }}
          animate={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          )}
          
          {!loading && icon && iconPosition === 'left' && (
            <motion.div
              initial={{ x: -5, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {icon}
            </motion.div>
          )}
          
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            {children}
          </motion.span>
          
          {!loading && icon && iconPosition === 'right' && (
            <motion.div
              initial={{ x: 5, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {icon}
            </motion.div>
          )}
        </motion.div>
        
        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 bg-white opacity-0 rounded-md"
          whileTap={{ opacity: [0, 0.1, 0] }}
          transition={{ duration: 0.3 }}
        />
      </Button>
    </motion.div>
  );
}

export default EnhancedButton;
