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
      <motion.div
        className="mt-2 text-center relative"
        style={{
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          background: 'linear-gradient(135deg, rgba(154, 205, 50, 0.08) 0%, rgba(74, 85, 104, 0.08) 100%)',
          borderRadius: '8px',
          padding: '4px 8px',
          border: '1px solid rgba(154, 205, 50, 0.15)'
        }}
      >
        <div className="text-3xl font-bold leading-none tracking-wide">
          <span 
            className="text-[#9ACD32]" 
            style={{ 
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            nava
          </span>
          <span 
            className="text-[#4A5568]" 
            style={{ 
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            dhiti
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};