import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  hoverScale?: number;
  initialY?: number;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, delay = 0, duration = 0.3, hoverScale = 1.02, initialY = 20, ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: initialY, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          delay, 
          duration, 
          ease: "easeOut",
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        whileHover={{ 
          scale: hoverScale,
          y: -8, 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
        className={cn("transition-all duration-200 ease-out", className)}
        ref={ref}
        {...props}
      >
        <Card className="transition-all duration-200 ease-out hover:border-primary/30 backdrop-blur-sm">
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";