
import { Variants, Transition } from 'framer-motion';

// Common transition settings
export const defaultTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0.0, 0.2, 1], // Material Design easing
};

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: defaultTransition,
  },
};

// Section entrance variants
export const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...defaultTransition,
      duration: 0.4,
    },
  },
};

// Card/item entrance variants
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: defaultTransition,
  },
};

// Stagger children animation
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Modal/dialog variants
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...defaultTransition,
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      ...defaultTransition,
      duration: 0.15,
    },
  },
};

// Button hover/tap animations
export const buttonVariants: Variants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.15 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};
