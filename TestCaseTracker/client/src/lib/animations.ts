

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

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

export const elasticTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 10,
};

// Advanced Page Transition Variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 30,
    scale: 0.95,
    filter: "blur(6px)",
    rotateY: -5,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    rotateY: 0,
    transition: {
      ...defaultTransition,
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
  exit: {
    opacity: 0,
    x: -30,
    scale: 0.95,
    filter: "blur(6px)",
    rotateY: 5,
    transition: fastTransition,
  },
};

// Login Page Orchestrated Entrance
export const loginPageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.4 },
  },
};

export const loginFormVariants: Variants = {
  initial: {
    opacity: 0,
    y: 60,
    scale: 0.9,
    rotateX: -15,
    transformPerspective: 1000,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      ...springTransition,
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export const loginHeaderVariants: Variants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...elasticTransition,
      delay: 0.1,
    },
  },
};

// Enhanced Form and Input Transitions
export const formVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      ...defaultTransition,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const inputVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.95,
    rotateY: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      ...defaultTransition,
      duration: 0.5,
    },
  },
  focus: {
    scale: 1.02,
    y: -2,
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)",
    transition: { duration: 0.2 },
  },
  blur: {
    scale: 1,
    y: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: { duration: 0.2 },
  },
};

// Floating Label Animation
export const floatingLabelVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    color: "#9CA3AF",
  },
  active: {
    y: -24,
    scale: 0.85,
    color: "#3B82F6",
    transition: { duration: 0.2 },
  },
};

// Advanced Module and Section Variants
export const moduleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
    rotateX: -15,
    transformPerspective: 1000,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: {
      ...springTransition,
      duration: 0.6,
    },
  },
  hover: {
    y: -8,
    rotateX: 2,
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
    transition: { duration: 0.3 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Curtain Reveal Animation
export const curtainRevealVariants: Variants = {
  hidden: {
    clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)",
  },
  visible: {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Morphing Card Variants
export const morphingCardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    borderRadius: "50%",
    rotate: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    borderRadius: "8px",
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
  hover: {
    scale: 1.03,
    rotate: 1,
    borderRadius: "12px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
    transition: { duration: 0.3 },
  },
};

// Staggered Grid Animation
export const staggeredGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const gridItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 30,
    rotateY: -15,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateY: 0,
    transition: {
      ...springTransition,
      duration: 0.5,
    },
  },
};

// Advanced Button Variants with Ripple
export const advancedButtonVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
    transition: { duration: 0.3 },
  },
  tap: {
    scale: 0.95,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: { duration: 0.1 },
  },
  loading: {
    scale: 1,
    opacity: 0.7,
    rotate: [0, 360],
    transition: {
      rotate: { duration: 1, repeat: Infinity, ease: "linear" },
      opacity: { duration: 0.2 },
    },
  },
};

// Slide and Zoom Reveal
export const slideZoomVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -100,
    scale: 0.8,
    skewX: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    skewX: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// Navigation Menu Animations
export const navMenuVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
  },
  visible: {
    opacity: 1,
    height: "auto",
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    transition: {
      duration: 0.5,
      ease: "easeInOut",
      staggerChildren: 0.1,
    },
  },
};

export const navItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: defaultTransition,
  },
  hover: {
    x: 5,
    scale: 1.05,
    color: "#3B82F6",
    transition: { duration: 0.2 },
  },
};

// Modal with Backdrop Blur
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 100,
    rotateX: -20,
    transformPerspective: 1000,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      ...springTransition,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 100,
    rotateX: -20,
    transition: {
      duration: 0.3,
    },
  },
};

export const backdropVariants: Variants = {
  hidden: { 
    opacity: 0,
    backdropFilter: "blur(0px)",
  },
  visible: { 
    opacity: 1,
    backdropFilter: "blur(8px)",
    transition: { duration: 0.3 },
  },
  exit: { 
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: 0.3 },
  },
};

// Sidebar with Slide Animation
export const sidebarVariants: Variants = {
  hidden: {
    x: -300,
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      ...springTransition,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    x: -300,
    opacity: 0,
    scale: 0.95,
    transition: fastTransition,
  },
};

// Parallax Scroll Effect
export const parallaxVariants: Variants = {
  offscreen: {
    y: 100,
    opacity: 0,
    scale: 0.9,
    rotateX: -10,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

// Settings Page Specific Animations
export const settingsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

export const settingsCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
    rotateY: -5,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      ...springTransition,
      duration: 0.5,
    },
  },
  hover: {
    y: -5,
    scale: 1.02,
    boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
    transition: { duration: 0.3 },
  },
};

// Utility Animation Functions
export const createSlideInVariants = (direction: 'left' | 'right' | 'up' | 'down' = 'up', distance: number = 50): Variants => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -distance, rotateY: -10 };
      case 'right': return { x: distance, rotateY: 10 };
      case 'up': return { y: distance, rotateX: -10 };
      case 'down': return { y: -distance, rotateX: 10 };
    }
  };

  return {
    hidden: {
      opacity: 0,
      scale: 0.9,
      ...getInitialPosition(),
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      transition: {
        ...springTransition,
        duration: 0.6,
      },
    },
  };
};

export const createStaggeredReveal = (staggerDelay: number = 0.1, totalDuration: number = 0.8): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.2,
      duration: totalDuration,
    },
  },
});

// Complex orchestrated animations
export const orchestratedEntrance: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 1.2,
      staggerChildren: 0.12,
      delayChildren: 0.3,
      when: "beforeChildren",
    },
  },
};

export const sceneLoadAnimation: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 1,
      ease: "easeOut",
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

