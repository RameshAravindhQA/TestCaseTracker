
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
        delay: i * 0.05,
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

  return (
    <motion.div 
      className={`flex flex-col items-center ${className}`}
      initial={animate ? "initial" : "animate"}
      animate="animate"
    >
      <motion.svg
        viewBox="0 0 200 160"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tree Trunk */}
        <motion.path
          d="M95 120 Q95 130 95 140 Q95 150 105 150 Q115 150 115 140 Q115 130 115 120"
          stroke="#4A5568"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        {/* Main Branches */}
        <motion.path
          d="M100 120 Q85 110 75 100 Q65 90 70 85"
          stroke="#4A5568"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M105 120 Q120 110 130 100 Q140 90 135 85"
          stroke="#4A5568"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M100 115 Q90 105 85 95 Q80 85 85 80"
          stroke="#4A5568"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M105 115 Q115 105 120 95 Q125 85 120 80"
          stroke="#4A5568"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />

        {/* Leaves arranged in a natural tree pattern */}
        {[
          // Top leaves
          { x: 100, y: 30, size: 8, rotation: 0 },
          { x: 95, y: 25, size: 6, rotation: 15 },
          { x: 105, y: 25, size: 6, rotation: -15 },
          { x: 90, y: 35, size: 7, rotation: 30 },
          { x: 110, y: 35, size: 7, rotation: -30 },
          
          // Second layer
          { x: 85, y: 45, size: 9, rotation: 45 },
          { x: 115, y: 45, size: 9, rotation: -45 },
          { x: 100, y: 40, size: 8, rotation: 0 },
          { x: 78, y: 50, size: 7, rotation: 60 },
          { x: 122, y: 50, size: 7, rotation: -60 },
          
          // Third layer
          { x: 75, y: 60, size: 10, rotation: 75 },
          { x: 125, y: 60, size: 10, rotation: -75 },
          { x: 95, y: 55, size: 8, rotation: 20 },
          { x: 105, y: 55, size: 8, rotation: -20 },
          { x: 70, y: 65, size: 8, rotation: 90 },
          { x: 130, y: 65, size: 8, rotation: -90 },
          
          // Fourth layer
          { x: 65, y: 75, size: 11, rotation: 105 },
          { x: 135, y: 75, size: 11, rotation: -105 },
          { x: 85, y: 70, size: 9, rotation: 40 },
          { x: 115, y: 70, size: 9, rotation: -40 },
          { x: 100, y: 65, size: 7, rotation: 0 },
          
          // Fifth layer
          { x: 60, y: 85, size: 12, rotation: 120 },
          { x: 140, y: 85, size: 12, rotation: -120 },
          { x: 75, y: 80, size: 10, rotation: 80 },
          { x: 125, y: 80, size: 10, rotation: -80 },
          { x: 90, y: 75, size: 8, rotation: 35 },
          { x: 110, y: 75, size: 8, rotation: -35 },
          
          // Sixth layer
          { x: 55, y: 95, size: 13, rotation: 135 },
          { x: 145, y: 95, size: 13, rotation: -135 },
          { x: 70, y: 90, size: 11, rotation: 100 },
          { x: 130, y: 90, size: 11, rotation: -100 },
          { x: 85, y: 85, size: 9, rotation: 50 },
          { x: 115, y: 85, size: 9, rotation: -50 },
          
          // Bottom layer
          { x: 50, y: 105, size: 14, rotation: 150 },
          { x: 150, y: 105, size: 14, rotation: -150 },
          { x: 65, y: 100, size: 12, rotation: 115 },
          { x: 135, y: 100, size: 12, rotation: -115 },
          { x: 80, y: 95, size: 10, rotation: 65 },
          { x: 120, y: 95, size: 10, rotation: -65 },
          
          // Additional scattered leaves
          { x: 88, y: 88, size: 6, rotation: 25 },
          { x: 112, y: 88, size: 6, rotation: -25 },
          { x: 77, y: 78, size: 7, rotation: 55 },
          { x: 123, y: 78, size: 7, rotation: -55 },
          { x: 92, y: 48, size: 5, rotation: 10 },
          { x: 108, y: 48, size: 5, rotation: -10 },
        ].map((leaf, i) => (
          <motion.ellipse
            key={i}
            cx={leaf.x}
            cy={leaf.y}
            rx={leaf.size}
            ry={leaf.size * 0.6}
            fill="#9ACD32"
            transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}
            variants={animate ? leafVariants : {}}
            custom={i}
          />
        ))}
        
        {/* Roots */}
        <motion.path
          d="M95 150 Q85 155 75 160"
          stroke="#4A5568"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M115 150 Q125 155 135 160"
          stroke="#4A5568"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M100 150 Q100 155 100 160"
          stroke="#4A5568"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
      </motion.svg>
      
      {/* NavaDhiti Text */}
      <motion.div
        className="mt-2 text-center"
        variants={animate ? textVariants : {}}
      >
        <div className="text-2xl font-bold text-green-600">
          <span className="text-green-500">nava</span>
          <span className="text-gray-600">dhiti</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
