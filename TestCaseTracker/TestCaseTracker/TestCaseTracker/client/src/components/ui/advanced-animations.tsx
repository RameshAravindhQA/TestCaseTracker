
import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';

// Advanced scroll-triggered animations
export const ScrollTriggeredSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "" 
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale, y }}
      initial={{ opacity: 0, y: 100 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Parallax background component
export const ParallaxBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -400]);

  return (
    <div className="relative overflow-hidden">
      {/* Background layers */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute inset-0 bg-gradient-to-tr from-indigo-900/10 to-pink-900/10"
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Interactive hover animations
export const InteractiveCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  glowEffect?: boolean;
}> = ({ children, className = "", glowEffect = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const springConfig = { stiffness: 300, damping: 30 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateXValue = (event.clientY - centerY) / 10;
    const rotateYValue = (centerX - event.clientX) / 10;

    x.set((event.clientX - centerX) / 10);
    y.set((event.clientY - centerY) / 10);
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      style={{ x, y, rotateX, rotateY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      className={`transform-gpu perspective-1000 ${className}`}
    >
      <motion.div
        animate={{
          boxShadow: isHovered && glowEffect
            ? "0 20px 40px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)"
            : "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Morphing text animation
export const MorphingText: React.FC<{ 
  texts: string[]; 
  className?: string;
  interval?: number;
}> = ({ texts, className = "", interval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <div className={`relative ${className}`}>
      {texts.map((text, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: index === currentIndex ? 1 : 0,
            y: index === currentIndex ? 0 : 20,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`absolute inset-0 ${index === currentIndex ? "relative" : "absolute"}`}
        >
          {text}
        </motion.span>
      ))}
    </div>
  );
};

// Floating elements animation
export const FloatingElements: React.FC<{ count?: number; className?: string }> = ({ 
  count = 5, 
  className = "" 
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
          className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-30"
          style={{
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
};

// Staggered list animation
export const StaggeredList: React.FC<{ 
  children: React.ReactNode[]; 
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = "", staggerDelay = 0.1 }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Pulse animation component
export const PulseAnimation: React.FC<{ 
  children: React.ReactNode; 
  color?: string;
  size?: number;
}> = ({ children, color = "blue", size = 100 }) => {
  return (
    <div className="relative inline-block">
      {children}
      <motion.div
        className={`absolute inset-0 rounded-full bg-${color}-400 opacity-20`}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.2, 0, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
};

export {
  ScrollTriggeredSection,
  ParallaxBackground,
  InteractiveCard,
  MorphingText,
  FloatingElements,
  StaggeredList,
  PulseAnimation,
};
