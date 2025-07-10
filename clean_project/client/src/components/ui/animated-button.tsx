import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonProps } from "@radix-ui/react-button";
import { forwardRef } from "react";

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
  className?: string;
  whileHoverScale?: number;
  whileTapScale?: number;
  animate?: boolean;
  ripple?: boolean;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, whileHoverScale = 1.02, whileTapScale = 0.98, animate = true, ripple = true, ...props }, ref) => {
    if (!animate) {
      return (
        <Button className={className} ref={ref} {...props}>
          {children}
        </Button>
      );
    }

    return (
      <motion.div
        whileHover={{ 
          scale: whileHoverScale,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          y: -2
        }}
        whileTap={{ 
          scale: whileTapScale,
          y: 0,
          boxShadow: "0 5px 10px rgba(0,0,0,0.1)"
        }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 17
        }}
        className="relative overflow-hidden"
      >
        <Button 
          className={cn(
            "relative transition-all duration-200 ease-out",
            ripple && "overflow-hidden",
            className
          )} 
          ref={ref} 
          {...props}
        >
          {children}
          {ripple && (
            <motion.div
              className="absolute inset-0 bg-white opacity-0 rounded-inherit"
              whileTap={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 0.3 }}
            />
          )}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";