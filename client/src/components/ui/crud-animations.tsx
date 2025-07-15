import React from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LOTTIE_ANIMATIONS } from "@/utils/lottie-animations";

interface CrudAnimationProps {
  type: "create" | "read" | "update" | "delete" | "loading" | "success" | "error";
  size?: "sm" | "md" | "lg";
  className?: string;
  onComplete?: () => void;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16", 
  lg: "w-24 h-24"
};

// Animation URLs from our library
const animationUrls = {
  create: LOTTIE_ANIMATIONS.createAction.url,
  read: LOTTIE_ANIMATIONS.search.url,
  update: LOTTIE_ANIMATIONS.editAction.url,
  delete: LOTTIE_ANIMATIONS.deleteAction.url,
  loading: LOTTIE_ANIMATIONS.loading.url,
  success: LOTTIE_ANIMATIONS.success.url,
  error: LOTTIE_ANIMATIONS.error.url
};

export const CrudAnimation: React.FC<CrudAnimationProps> = ({
  type,
  size = "md",
  className,
  onComplete
}) => {
  const [animationData, setAnimationData] = React.useState(null);
  const animationUrl = animationUrls[type];

  React.useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch(animationUrl);
        if (response.ok) {
          const data = await response.json();
          setAnimationData(data);
        }
      } catch (error) {
        console.error("Error loading animation:", error);
      }
    };

    if (animationUrl) {
      loadAnimation();
    }
  }, [animationUrl]);

  const colorSchemes = {
    create: "from-green-400 to-emerald-500",
    read: "from-blue-400 to-cyan-500",
    update: "from-yellow-400 to-orange-500",
    delete: "from-red-400 to-rose-500",
    loading: "from-purple-400 to-indigo-500",
    success: "from-green-400 to-emerald-500",
    error: "from-red-400 to-rose-500"
  };

  return (
    <motion.div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
        colorSchemes[type],
        sizeClasses[size],
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "backOut" }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {animationData ? (
        <Lottie
          animationData={animationData}
          className="w-3/4 h-3/4"
          loop={type === "loading"}
          autoplay
          onComplete={onComplete}
        />
      ) : (
        <div className="w-3/4 h-3/4 bg-white/20 rounded-full animate-pulse" />
      )}
    </motion.div>
  );
};

// Specific CRUD operation components
export const CreateAnimation: React.FC<Omit<CrudAnimationProps, "type">> = (props) => (
  <CrudAnimation type="create" {...props} />
);

export const ReadAnimation: React.FC<Omit<CrudAnimationProps, "type">> = (props) => (
  <CrudAnimation type="read" {...props} />
);

export const UpdateAnimation: React.FC<Omit<CrudAnimationProps, "type">> = (props) => (
  <CrudAnimation type="update" {...props} />
);

export const DeleteAnimation: React.FC<Omit<CrudAnimationProps, "type">> = (props) => (
  <CrudAnimation type="delete" {...props} />
);

export const LoadingAnimation: React.FC<Omit<CrudAnimationProps, "type">> = (props) => (
  <CrudAnimation type="loading" {...props} />
);

export const SuccessAnimation: React.FC<Omit<CrudAnimationProps, "type">> = (props) => (
  <CrudAnimation type="success" {...props} />
);

export const ErrorAnimation: React.FC<Omit<CrudAnimationProps, "type">> = (props) => (
  <CrudAnimation type="error" {...props} />
);