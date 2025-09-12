
import React from "react";
import { motion } from "framer-motion";

interface NavadhitiLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export const NavadhitiLogo: React.FC<NavadhitiLogoProps> = ({ 
  className = "", 
  size = "lg" 
}) => {
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
    xl: "h-40 w-40",
    "2xl": "h-48 w-48"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.6,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      className={`${className} flex items-center justify-center`}
    >
      <motion.img
        src="/images/NDlogo-removebg-preview.png"
        alt="NavaDhiti Logo"
        className={`${sizeClasses[size]} object-contain`}
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut"
        }}
        whileHover={{
          rotate: 5,
          transition: { duration: 0.3 }
        }}
      />
    </motion.div>
  );
};
