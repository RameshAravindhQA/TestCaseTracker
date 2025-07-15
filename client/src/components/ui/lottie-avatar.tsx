import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { EnhancedLottie } from './enhanced-lottie';
import { LOTTIE_ANIMATIONS } from "@/utils/lottie-animations";

interface LottieAvatarProps {
  userId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackName?: string;
}

export function LottieAvatar({ 
  userId, 
  size = 'md', 
  className = '',
  fallbackName 
}: LottieAvatarProps) {
  // Get animation based on user ID or fallback to default
  const avatarAnimations = [
    { url: LOTTIE_ANIMATIONS.profile?.url },
    { url: LOTTIE_ANIMATIONS.female?.url },
    { url: LOTTIE_ANIMATIONS.business?.url },
    { url: LOTTIE_ANIMATIONS.office?.url },
    { url: LOTTIE_ANIMATIONS.rocket?.url }
  ];

  const [currentAnimation, setCurrentAnimation] = useState(() => 
    avatarAnimations[Math.floor(Math.random() * avatarAnimations.length)]
  );

  const animation = currentAnimation;

  // Size configurations
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  // Fallback to simple avatar if animation is not available
  if (!animation || !animation.url) {
    const initials = fallbackName ? fallbackName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    return (
      <motion.div
        className={`${sizeMap[size]} ${className} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg`}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {fallbackName ? (
          <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
            {initials}
          </span>
        ) : (
          <User className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${sizeMap[size]} ${className} rounded-full overflow-hidden shadow-lg border-2 border-white/10`}
      whileHover={{ scale: 1.05, rotate: 5 }}
      transition={{ duration: 0.2 }}
    >
      <EnhancedLottie
        customUrl={animation.url}
        loop={true}
        autoplay={true}
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}