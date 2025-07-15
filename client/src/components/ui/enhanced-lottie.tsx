import React, { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LOTTIE_ANIMATIONS } from "@/utils/lottie-animations";

interface EnhancedLottieProps {
  animationName?: keyof typeof LOTTIE_ANIMATIONS;
  customUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  onComplete?: () => void;
  trigger?: boolean;
  withBackground?: boolean;
  backgroundGradient?: string;
}

const sizeClasses = {
  xs: "w-4 h-4",
  sm: "w-8 h-8",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
  "2xl": "w-48 h-48"
};

export const EnhancedLottie: React.FC<EnhancedLottieProps> = ({
  animationName,
  customUrl,
  size = "md",
  className,
  loop = true,
  autoplay = true,
  onComplete,
  trigger = true,
  withBackground = false,
  backgroundGradient = "from-blue-400 to-purple-500"
}) => {
  const [animationData, setAnimationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const animationUrl = customUrl || (animationName ? LOTTIE_ANIMATIONS[animationName]?.url : null);

  useEffect(() => {
    const loadAnimation = async () => {
      if (!animationUrl) return;

      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(animationUrl);
        if (!response.ok) throw new Error("Failed to load animation");
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error("Error loading Lottie animation:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnimation();
  }, [animationUrl]);

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center",
        withBackground && `rounded-full bg-gradient-to-br ${backgroundGradient}`,
        sizeClasses[size],
        className
      )}>
        <div className="w-1/2 h-1/2 bg-white/30 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (hasError || !animationData) {
    return (
      <div className={cn(
        "flex items-center justify-center text-gray-400",
        withBackground && `rounded-full bg-gradient-to-br ${backgroundGradient}`,
        sizeClasses[size],
        className
      )}>
        <span className="text-xs">🎬</span>
      </div>
    );
  }

  const LottieComponent = (
    <Lottie
      animationData={animationData}
      className="w-full h-full"
      loop={loop}
      autoplay={autoplay && trigger}
      onComplete={onComplete}
    />
  );

  if (withBackground) {
    return (
      <motion.div
        className={cn(
          "rounded-full bg-gradient-to-br flex items-center justify-center p-2",
          backgroundGradient,
          sizeClasses[size],
          className
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "backOut" }}
        whileHover={{ scale: 1.05 }}
      >
        {LottieComponent}
      </motion.div>
    );
  }

  return (
    <div className={cn(sizeClasses[size], className)}>
      {LottieComponent}
    </div>
  );
};

// Convenience components for common use cases
export const LottieIcon: React.FC<Omit<EnhancedLottieProps, 'size'> & { size?: "xs" | "sm" | "md" }> = (props) => (
  <EnhancedLottie size={props.size || "sm"} {...props} />
);

export const LottieIllustration: React.FC<Omit<EnhancedLottieProps, 'size'> & { size?: "lg" | "xl" | "2xl" }> = (props) => (
  <EnhancedLottie size={props.size || "xl"} {...props} />
);

export const LottieButton: React.FC<EnhancedLottieProps> = (props) => (
  <EnhancedLottie withBackground={true} size="md" {...props} />
);