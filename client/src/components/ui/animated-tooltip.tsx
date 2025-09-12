
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedTooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const sideVariants = {
  top: {
    initial: { opacity: 0, y: 10, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.8 }
  },
  bottom: {
    initial: { opacity: 0, y: -10, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.8 }
  },
  left: {
    initial: { opacity: 0, x: 10, scale: 0.8 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 10, scale: 0.8 }
  },
  right: {
    initial: { opacity: 0, x: -10, scale: 0.8 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -10, scale: 0.8 }
  }
};

export function AnimatedTooltip({ 
  content, 
  children, 
  side = 'top', 
  className 
}: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap",
              side === 'top' && "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
              side === 'bottom' && "top-full left-1/2 transform -translate-x-1/2 mt-2",
              side === 'left' && "right-full top-1/2 transform -translate-y-1/2 mr-2",
              side === 'right' && "left-full top-1/2 transform -translate-y-1/2 ml-2",
              className
            )}
            variants={sideVariants[side]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
          >
            {content}
            {/* Arrow */}
            <div 
              className={cn(
                "absolute w-2 h-2 bg-gray-900 transform rotate-45",
                side === 'top' && "top-full left-1/2 -translate-x-1/2 -mt-1",
                side === 'bottom' && "bottom-full left-1/2 -translate-x-1/2 -mb-1",
                side === 'left' && "left-full top-1/2 -translate-y-1/2 -ml-1",
                side === 'right' && "right-full top-1/2 -translate-y-1/2 -mr-1"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AnimatedTooltip;
