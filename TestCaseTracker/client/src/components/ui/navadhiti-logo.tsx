
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
      className={`flex flex-col items-center justify-center ${className}`}
      initial={animate ? "initial" : "animate"}
      animate="animate"
    >
      {/* Logo SVG */}
      <motion.svg
        viewBox="0 0 200 140"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tree Trunk - Main */}
        <motion.path
          d="M95 110 Q95 115 95 125 Q95 130 100 130 Q105 130 105 125 Q105 115 105 110"
          stroke="#4A5568"
          strokeWidth="6"
          fill="#5D4037"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        {/* Main Branches */}
        <motion.path
          d="M100 110 Q85 105 75 95 Q70 90 72 88"
          stroke="#4A5568"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M100 110 Q115 105 125 95 Q130 90 128 88"
          stroke="#4A5568"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M98 108 Q88 103 82 95 Q78 90 80 88"
          stroke="#4A5568"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M102 108 Q112 103 118 95 Q122 90 120 88"
          stroke="#4A5568"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />

        {/* Secondary Branches */}
        <motion.path
          d="M95 105 Q90 100 85 92"
          stroke="#4A5568"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M105 105 Q110 100 115 92"
          stroke="#4A5568"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />

        {/* Leaves - Dense canopy */}
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
          />
        ))}
        
        {/* Roots */}
        <motion.path
          d="M95 130 Q85 133 78 136"
          stroke="#4A5568"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M105 130 Q115 133 122 136"
          stroke="#4A5568"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
        
        <motion.path
          d="M100 130 Q100 133 100 136"
          stroke="#4A5568"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          variants={animate ? trunkVariants : {}}
        />
      </motion.svg>
      
      {/* NavaDhiti Text - Exact styling from reference */}
      <motion.div
        className="mt-1 text-center"
        variants={animate ? textVariants : {}}
      >
        <div className="text-3xl font-bold leading-none">
          <span className="text-[#9ACD32]" style={{ fontFamily: 'Arial, sans-serif' }}>nava</span>
          <span className="text-[#4A5568]" style={{ fontFamily: 'Arial, sans-serif' }}>dhiti</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
