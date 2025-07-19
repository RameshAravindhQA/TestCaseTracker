
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavadhitiLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  animated?: boolean;
  autoPlay?: boolean;
  onAnimationComplete?: () => void;
}

export const NavadhitiLogo: React.FC<NavadhitiLogoProps> = ({ 
  className = "", 
  size = "lg",
  animated = true,
  autoPlay = true,
  onAnimationComplete
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'text' | 'tree' | 'complete'>('text');

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24", 
    lg: "h-32 w-32",
    xl: "h-40 w-40",
    "2xl": "h-48 w-48"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
    "2xl": "text-4xl"
  };

  useEffect(() => {
    if (animated && autoPlay) {
      const timer = setTimeout(() => {
        setShowAnimation(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [animated, autoPlay]);

  const letters = "navadhiti".split("");

  const letterVariants = {
    hidden: { 
      y: -100, 
      opacity: 0,
      rotateZ: -10 
    },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      rotateZ: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom bounce easing
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    })
  };

  const treeVariants = {
    hidden: { 
      scale: 0,
      opacity: 0 
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 2.5, // Start after text animation
        duration: 1.5,
        ease: "easeOut"
      }
    }
  };

  const trunkVariants = {
    hidden: { 
      scaleY: 0,
      originY: 1 
    },
    visible: {
      scaleY: 1,
      transition: {
        delay: 3.0,
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const leavesVariants = {
    hidden: { 
      scale: 0,
      opacity: 0 
    },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 3.8 + (i * 0.1),
        duration: 0.4,
        ease: "easeOut",
        type: "spring",
        damping: 15,
        stiffness: 300
      }
    })
  };

  const handleTextAnimationComplete = () => {
    setTimeout(() => {
      setCurrentPhase('tree');
    }, 500);
  };

  const handleTreeAnimationComplete = () => {
    setCurrentPhase('complete');
    onAnimationComplete?.();
  };

  if (!animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        className={`${className} flex items-center justify-center`}
      >
        <motion.img
          src="/images/NDlogo-removebg-preview.png"
          alt="NavaDhiti Logo"
          className={`${sizeClasses[size]} object-contain`}
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          whileHover={{ rotate: 5, transition: { duration: 0.3 } }}
        />
      </motion.div>
    );
  }

  return (
    <div className={`${className} relative flex flex-col items-center justify-center`}>
      <AnimatePresence>
        {showAnimation && (
          <>
            {/* Falling Text Animation (1s - 2s) */}
            <motion.div
              className={`flex ${textSizeClasses[size]} font-bold text-green-700 mb-4`}
              initial="hidden"
              animate="visible"
              onAnimationComplete={handleTextAnimationComplete}
            >
              {letters.map((letter, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={letterVariants}
                  className="inline-block"
                  style={{ 
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    marginRight: letter === 'a' && i > 0 ? '1px' : '0'
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>

            {/* Tree Growth Animation (2s - 4s) */}
            <motion.div
              className="relative"
              variants={treeVariants}
              initial="hidden"
              animate={currentPhase !== 'text' ? 'visible' : 'hidden'}
              onAnimationComplete={handleTreeAnimationComplete}
            >
              {/* Tree Base Container */}
              <div className={`relative ${sizeClasses[size]}`}>
                {/* Trunk */}
                <motion.div
                  variants={trunkVariants}
                  initial="hidden"
                  animate={currentPhase === 'tree' ? 'visible' : 'hidden'}
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-8 bg-amber-800 rounded-sm"
                />

                {/* Branches */}
                <motion.div
                  variants={trunkVariants}
                  initial="hidden"
                  animate={currentPhase === 'tree' ? 'visible' : 'hidden'}
                  className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
                >
                  {/* Main canopy */}
                  <motion.div
                    variants={leavesVariants}
                    custom={0}
                    initial="hidden"
                    animate={currentPhase === 'tree' ? 'visible' : 'hidden'}
                    className="w-16 h-16 bg-green-500 rounded-full"
                  />
                  
                  {/* Side leaves */}
                  <motion.div
                    variants={leavesVariants}
                    custom={1}
                    initial="hidden"
                    animate={currentPhase === 'tree' ? 'visible' : 'hidden'}
                    className="absolute -top-2 -left-3 w-8 h-8 bg-green-400 rounded-full"
                  />
                  
                  <motion.div
                    variants={leavesVariants}
                    custom={2}
                    initial="hidden"
                    animate={currentPhase === 'tree' ? 'visible' : 'hidden'}
                    className="absolute -top-2 -right-3 w-8 h-8 bg-green-400 rounded-full"
                  />

                  <motion.div
                    variants={leavesVariants}
                    custom={3}
                    initial="hidden"
                    animate={currentPhase === 'tree' ? 'visible' : 'hidden'}
                    className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-600 rounded-full"
                  />

                  <motion.div
                    variants={leavesVariants}
                    custom={4}
                    initial="hidden"
                    animate={currentPhase === 'tree' ? 'visible' : 'hidden'}
                    className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-600 rounded-full"
                  />
                </motion.div>

                {/* Floating particles for magical effect */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ 
                      scale: 0, 
                      x: Math.random() * 60 - 30, 
                      y: Math.random() * 60 - 30,
                      opacity: 0 
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 0.7, 0],
                      y: [0, -20, -40]
                    }}
                    transition={{
                      delay: 4 + (i * 0.2),
                      duration: 2,
                      ease: "easeOut"
                    }}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      filter: 'blur(0.5px)',
                      boxShadow: '0 0 10px rgba(255,255,0,0.5)'
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Final Logo Reveal */}
            <AnimatePresence>
              {currentPhase === 'complete' && (
                <motion.img
                  src="/images/NDlogo-removebg-preview.png"
                  alt="NavaDhiti Logo"
                  className={`${sizeClasses[size]} object-contain absolute`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.5,
                    duration: 0.8,
                    ease: "easeOut" 
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
