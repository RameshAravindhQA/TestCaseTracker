import React from 'react';
import { motion } from 'framer-motion';

interface NavaDhitiLogoProps {
  className?: string;
  animate?: boolean;
}

export const NavaDhitiLogo: React.FC<NavaDhitiLogoProps> = ({ 
  className = "h-32 w-32", 
  animate = true 
}) => {

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center ${className} logo-container`}
      initial={false ? "initial" : "animate"}
      animate="animate"
      style={{
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
        borderRadius: '12px',
        padding: '8px',
        border: '1px solid rgba(154, 205, 50, 0.1)'
      }}
    >
      <img src="/images/NDlogo-removebg-preview.png" alt="NavaDhiti Logo" className="w-full h-auto" />

      {/* NavaDhiti Text - Enhanced with better integration */}
      
    </motion.div>
  );
};