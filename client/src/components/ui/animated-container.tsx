import React from 'react';
import { motion, Variants } from 'framer-motion';

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  animation?: 'fade' | 'slide' | 'scale' | 'slideUp';
}

export function AnimatedContainer({
  children,
  className = '',
  delay = 0,
  staggerChildren = 0.05,
  direction = "up",
  distance = 30,
  animation = 'fade'
}: AnimatedContainerProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up": return { y: distance };
      case "down": return { y: -distance };
      case "left": return { x: distance };
      case "right": return { x: -distance };
      default: return { y: distance };
    }
  };

  // Define animations
  const animations: Record<string, Variants> = {
    fade: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { 
          duration: 0.4,
          delay 
        }
      }
    },
    slide: {
      hidden: { opacity: 0, x: -20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { 
          type: 'spring', 
          damping: 25, 
          stiffness: 500,
          delay 
        }
      }
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          type: 'spring', 
          damping: 25, 
          stiffness: 500,
          delay 
        }
      }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
          type: 'spring', 
          damping: 25, 
          stiffness: 500,
          delay 
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...getInitialPosition()
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      transition={{ 
        delay, 
        staggerChildren,
        duration: 0.6,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// For creating staggered animations with multiple children
export function AnimatedList({
  children,
  className = '',
  animation = 'fade',
  staggerDelay = 0.1
}: AnimatedContainerProps & { staggerDelay?: number }) {

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  // Select the child animation
  const childAnimations: Record<string, Variants> = {
    fade: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration: 0.3 }
      }
    },
    slide: {
      hidden: { opacity: 0, x: -20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { 
          type: 'spring', 
          damping: 25, 
          stiffness: 500 
        }
      }
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          type: 'spring', 
          damping: 25, 
          stiffness: 500 
        }
      }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
          type: 'spring', 
          damping: 25, 
          stiffness: 500 
        }
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={childAnimations[animation]}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}