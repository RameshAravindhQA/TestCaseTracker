import React from 'react';
import { motion } from 'framer-motion';

interface NavadhitiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const NavadhitiLogo: React.FC<NavadhitiLogoProps> = ({ 
  className = '', 
  size = 'xl' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 1.2,
        ease: [0.6, 0.05, 0.01, 0.9],
        rotate: {
          delay: 0.8,
          duration: 0.6,
          ease: "easeInOut"
        }
      }}
      className={`${className} flex items-center justify-center drop-shadow-lg`}
    >
      <img
        src="/images/navadhiti-logo-tree.jpg"
        alt="Navadhiti Logo"
        className={`${sizeClasses[size]} rounded-full object-cover shadow-lg border-2 border-white/20`}
      />
    </motion.div>
  );
};