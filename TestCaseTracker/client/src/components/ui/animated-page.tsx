
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/lib/animations';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  key?: string;
}

export function AnimatedPage({ children, className = '', key }: AnimatedPageProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default AnimatedPage;
