
import React from 'react';
import { motion } from 'framer-motion';
import { sectionVariants } from '@/lib/animations';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedSection({ children, className = '', delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={sectionVariants}
      style={{
        transitionDelay: `${delay}ms`
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedSection;
