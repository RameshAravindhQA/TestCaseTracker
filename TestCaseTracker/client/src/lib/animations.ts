
import { Variants, Transition } from 'framer-motion';

// Enhanced transition settings with easing curves
export const defaultTransition: Transition = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1], // Custom cubic-bezier for smooth acceleration
};

export const fastTransition: Transition = {
  duration: 0.2,
  ease: [0.4, 0.0, 0.2, 1],
};

export const slowTransition: Transition = {
  duration: 0.6,
  ease: [0.25, 0.1, 0.25, 1],
};

// Page transition variants with advanced effects
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.95,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      ...defaultTransition,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.95,
    filter: "blur(4px)",
    transition: fastTransition,
  },
};

// Enhanced form and input transitions
export const formVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...defaultTransition,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const inputVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -15,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: defaultTransition,
  },
  focus: {
    scale: 1.02,
    transition: { duration: 0.15 },
  },
  blur: {
    scale: 1,
    transition: { duration: 0.15 },
  },
};

// Module and section entrance variants
export const moduleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    rotateX: -10,
    transformPerspective: 1000,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      ...defaultTransition,
      duration: 0.5,
    },
  },
  hover: {
    y: -5,
    rotateX: 2,
    transition: { duration: 0.2 },
  },
};

export const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...defaultTransition,
      duration: 0.5,
    },
  },
};

// Enhanced card variants with depth
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
    rotateY: -5,
    transformPerspective: 1000,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      ...defaultTransition,
      duration: 0.4,
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    rotateY: 2,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Advanced stagger animations
export const containerVariants: Variants = {
  hidden: { 
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      when: "beforeChildren",
    },
  },
};

export const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Modal and dialog variants with backdrop
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    rotateX: -15,
    transformPerspective: 1000,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      ...defaultTransition,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    rotateX: -15,
    transition: {
      duration: 0.2,
    },
  },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Button animations with enhanced feedback
export const buttonVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    transition: { duration: 0.15 },
  },
  tap: {
    scale: 0.95,
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    transition: { duration: 0.1 },
  },
  loading: {
    scale: 1,
    opacity: 0.7,
    transition: { duration: 0.2 },
  },
};

// List item animations
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.95,
    transition: fastTransition,
  },
};

// Navigation animations
export const navVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...defaultTransition,
      staggerChildren: 0.05,
    },
  },
};

// Sidebar animations
export const sidebarVariants: Variants = {
  hidden: {
    x: -300,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      ...defaultTransition,
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
  exit: {
    x: -300,
    opacity: 0,
    transition: fastTransition,
  },
};

// Table and data animations
export const tableVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.1,
    },
  },
};

export const tableRowVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  hover: {
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    transition: { duration: 0.15 },
  },
};

// Error and success animations
export const alertVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -30,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.9,
    transition: fastTransition,
  },
};

// Advanced floating animations
export const floatingVariants: Variants = {
  float: {
    y: [-5, 5, -5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Loading animations
export const loadingVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Utility functions for dynamic animations
export const createStaggerVariants = (staggerDelay: number = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
});

export const createSlideVariants = (direction: 'left' | 'right' | 'up' | 'down' = 'up', distance: number = 30): Variants => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -distance };
      case 'right': return { x: distance };
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
    }
  };

  return {
    hidden: {
      opacity: 0,
      ...getInitialPosition(),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: defaultTransition,
    },
  };
};
