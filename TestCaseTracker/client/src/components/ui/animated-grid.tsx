
import React from 'react';
import { motion } from 'framer-motion';
import { gridVariants, cardVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 2 | 4 | 6 | 8;
}

export function AnimatedGrid({ children, className, cols = 3, gap = 6 }: AnimatedGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  };

  const gridGap = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'grid',
        gridCols[cols],
        gridGap[gap],
        className
      )}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={cardVariants}
          whileHover="hover"
          whileTap="tap"
          layout
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default AnimatedGrid;
