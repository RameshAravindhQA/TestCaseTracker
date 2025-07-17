
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
  const leafVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.02,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  const trunkVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  const textVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 1, duration: 0.6 }
    }
  };

  // Generate leaves in a natural tree pattern
  const generateLeaves = () => {
    const leaves = [];
    const leafColors = ["#9ACD32", "#8FBC8F", "#7CB342", "#689F38", "#558B2F"];
    
    // Create a more natural leaf distribution
    for (let layer = 0; layer < 8; layer++) {
      const radius = 20 + (layer * 12);
      const leafCount = Math.floor(8 + (layer * 2));
      
      for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * 2 * Math.PI + (layer * 0.3);
        const x = 100 + Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
        const y = 80 + Math.sin(angle) * radius * (0.6 + Math.random() * 0.3) - (layer * 2);
        
        const size = 4 + Math.random() * 8;
        const rotation = (angle * 180 / Math.PI) + (Math.random() - 0.5) * 60;
        
        leaves.push({
          x, y, size, rotation,
          color: leafColors[Math.floor(Math.random() * leafColors.length)]
        });
      }
    }
    
    return leaves;
  };

  const leaves = generateLeaves();

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center ${className} logo-container`}
      initial={animate ? "initial" : "animate"}
      animate="animate"
      style={{
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
        background: 'linear-gradient(135deg, rgba(154, 205, 50, 0.05) 0%, rgba(116, 185, 255, 0.05) 100%)',
        borderRadius: '12px',
        padding: '8px',
        border: '1px solid rgba(154, 205, 50, 0.1)'
      }}
    >
      {/* Logo SVG */}
      <motion.svg
        viewBox="0 0 200 160"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
        }}
      >
        {/* Background circle for better integration */}
        <circle 
          cx="100" 
          cy="80" 
          r="75" 
          fill="rgba(154, 205, 50, 0.03)" 
          stroke="rgba(154, 205, 50, 0.1)" 
          strokeWidth="1"
        />
        
        {/* Tree Trunk - Main with gradient */}
        <defs>
          <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5D4037" />
            <stop offset="100%" stopColor="#4A5568" />
          </linearGradient>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9ACD32" />
            <stop offset="100%" stopColor="#7CB342" />
          </linearGradient>
        </defs>
        
        <motion.path
          d="M95 110 Q95 115 95 125 Q95 130 100 130 Q105 130 105 125 Q105 115 105 110"
          stroke="url(#trunkGradient)"
          strokeWidth="6"
          fill="url(#trunkGradient)"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        {/* Main Branches */}
        <motion.path
          d="M100 110 Q85 105 75 95 Q70 90 72 88"
          stroke="url(#trunkGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M100 110 Q115 105 125 95 Q130 90 128 88"
          stroke="url(#trunkGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M98 108 Q88 103 82 95 Q78 90 80 88"
          stroke="url(#trunkGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M102 108 Q112 103 118 95 Q122 90 120 88"
          stroke="url(#trunkGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />

        {/* Secondary Branches */}
        <motion.path
          d="M95 105 Q90 100 85 92"
          stroke="url(#trunkGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M105 105 Q110 100 115 92"
          stroke="url(#trunkGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />

        {/* Leaves - Dense canopy with enhanced styling */}
        {leaves.map((leaf, i) => (
          <motion.ellipse
            key={i}
            cx={leaf.x}
            cy={leaf.y}
            rx={leaf.size}
            ry={leaf.size * 0.7}
            fill={leaf.color}
            transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}
            variants={animate ? leafVariants : {}}
            custom={i}
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
            }}
          />
        ))}
        
        {/* Roots */}
        <motion.path
          d="M95 130 Q85 133 78 136"
          stroke="url(#trunkGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M105 130 Q115 133 122 136"
          stroke="url(#trunkGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M100 130 Q100 133 100 136"
          stroke="url(#trunkGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
      </motion.svg>
      
      {/* NavaDhiti Text - Enhanced with better integration */}
      <motion.div
        className="mt-2 text-center relative"
        variants={animate ? textVariants : {}}
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
