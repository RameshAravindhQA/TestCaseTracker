
export const animationConfig = {
  // Reduced motion for accessibility
  reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  
  // Fast transitions for better UX
  fast: {
    duration: 0.15,
    ease: "easeOut"
  },
  
  // Standard transitions
  standard: {
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94]
  },
  
  // Slow transitions for complex animations
  slow: {
    duration: 0.5,
    ease: [0.25, 0.46, 0.45, 0.94]
  },
  
  // Spring animations
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30
  },
  
  // Stagger animations
  stagger: {
    children: 0.1,
    delayChildren: 0.2
  }
};

// Optimized animation variants that respect reduced motion preferences
export const createOptimizedVariants = (baseVariants: any) => {
  if (animationConfig.reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.1 }
    };
  }
  return baseVariants;
};

// Performance monitoring for animations
export const animationPerformance = {
  // Track animation performance
  trackAnimation: (name: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 16) { // More than one frame at 60fps
      console.warn(`Animation "${name}" took ${duration.toFixed(2)}ms - consider optimization`);
    }
  },
  
  // Throttle animations under heavy load
  shouldAnimate: () => {
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      const memoryUsage = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;
      return memoryUsage < 0.8; // Reduce animations if memory usage is high
    }
    return true;
  }
};

// Optimized will-change management
export const willChangeOptimization = {
  add: (element: HTMLElement, properties: string[]) => {
    element.style.willChange = properties.join(', ');
  },
  
  remove: (element: HTMLElement) => {
    element.style.willChange = 'auto';
  }
};

export default animationConfig;
