import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavadhitiLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showText?: boolean;
  className?: string;
}

interface InlineNavadhitiLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface FullScreenNavadhitiLoaderProps {
  text?: string;
  isVisible?: boolean;
}

export const NavadhitiLoader: React.FC<NavadhitiLoaderProps> = ({
  size = 'md',
  text = 'Loading...',
  showText = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      {/* Logo with Animation */}
      <motion.div
        className={cn("relative", sizeClasses[size])}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <motion.img
          src="/images/navadhiti-logo-tree.jpg"
          alt="Navadhiti Logo"
          className="w-full h-full object-contain rounded-full shadow-lg"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Glowing Ring Animation */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-400 opacity-60"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Secondary Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-blue-400 opacity-40"
          animate={{
            scale: [1.2, 1.5, 1.2],
            opacity: [0.4, 0.1, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
        />
      </motion.div>

      {/* Loading Text */}
      {showText && (
        <motion.div
          className={cn(textSizeClasses[size], "font-medium text-gray-700 dark:text-gray-300")}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.div>
      )}

      {/* Loading Dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Full Screen Loader
export const FullScreenNavadhitiLoader: React.FC<FullScreenNavadhitiLoaderProps> = ({ 
  text = "Loading Test Case Management System...", 
  isVisible = true 
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mx-4">
        <NavadhitiLoader size="xl" text={text} />
      </div>
    </motion.div>
  );
};

// Inline Loader for components
export const InlineNavadhitiLoader: React.FC<InlineNavadhitiLoaderProps> = ({ 
  text = "Loading...", 
  size = 'md' 
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <NavadhitiLoader size={size} text={text} />
    </div>
  );
};

// Full screen overlay loader
export const OverlayNavadhitiLoader: React.FC<{ 
  isVisible?: boolean; 
  text?: string; 
}> = ({ 
  isVisible = true, 
  text = "Loading your workspace..." 
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <NavadhitiLoader size="xl" text={text} />
    </motion.div>
  );
};

export default NavadhitiLoader;