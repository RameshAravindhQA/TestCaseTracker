
import React from 'react';
import { motion } from 'framer-motion';
import { EnhancedLottie } from './enhanced-lottie';
import { cn } from '@/lib/utils';

interface LottieLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  text?: string;
  animationType?: 'rocket' | 'business' | 'office' | 'profile';
}

const sizeMap = {
  sm: '64px',
  md: '96px', 
  lg: '128px',
  xl: '192px'
};

const animationUrls = {
  rocket: '/lottie/Rocket lottie Animation_1752294834959.json',
  business: '/lottie/Business team_1752294842244.json',
  office: '/lottie/Office worker team work hello office waves_1752294845673.json',
  profile: '/lottie/Profile Avatar of Young Boy_1752294847420.json'
};

export function LottieLoader({
  size = 'md',
  className,
  showText = true,
  text = 'Loading...',
  animationType = 'rocket'
}: LottieLoaderProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4",
      className
    )}>
      <motion.div
        className="relative"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <EnhancedLottie
          customUrl={animationUrls[animationType]}
          size={size}
          loop={true}
          autoplay={true}
          className="w-full h-full"
        />
      </motion.div>
      
      {showText && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {text}
          </p>
          <motion.div
            className="flex items-center justify-center space-x-1 mt-2"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-2 h-2 bg-primary rounded-full" />
            <div className="w-2 h-2 bg-primary rounded-full" />
            <div className="w-2 h-2 bg-primary rounded-full" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// Inline version for smaller spaces
export function InlineLottieLoader({
  size = 'sm',
  animationType = 'rocket',
  className
}: {
  size?: 'sm' | 'md';
  animationType?: 'rocket' | 'business' | 'office' | 'profile';
  className?: string;
}) {
  return (
    <motion.div
      className={cn("inline-flex items-center space-x-2", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div style={{ width: sizeMap[size], height: sizeMap[size] }}>
        <EnhancedLottie
          customUrl={animationUrls[animationType]}
          size={size}
          loop={true}
          autoplay={true}
          className="w-full h-full"
        />
      </div>
      <span className="text-xs text-gray-500">Loading...</span>
    </motion.div>
  );
}

// Full screen overlay with Lottie animation
export function OverlayLottieLoader({
  isVisible = true,
  text = "Loading your workspace...",
  animationType = 'rocket'
}: {
  isVisible?: boolean;
  text?: string;
  animationType?: 'rocket' | 'business' | 'office' | 'profile';
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <LottieLoader 
        size="xl" 
        text={text} 
        animationType={animationType}
      />
    </motion.div>
  );
}

export default LottieLoader;
