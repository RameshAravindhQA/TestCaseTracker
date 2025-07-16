
import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  animationData?: any;
  animationPath?: string;
  className?: string;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
}

export function LottieAnimation({ 
  animationData, 
  animationPath,
  className = '', 
  width = 200, 
  height = 200, 
  loop = true, 
  autoplay = true,
  speed = 1
}: LottieAnimationProps) {
  const [loadedAnimationData, setLoadedAnimationData] = useState(animationData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!animationData && !!animationPath);

  useEffect(() => {
    if (animationPath && !animationData) {
      setLoading(true);
      fetch(animationPath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load animation: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          setLoadedAnimationData(data);
          setError(null);
        })
        .catch(err => {
          console.error('Failed to load Lottie animation:', err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [animationPath, animationData]);

  const style = {
    width: width,
    height: height,
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={style}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !loadedAnimationData) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`} style={style}>
        <span className="text-muted-foreground text-sm">Animation unavailable</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Lottie
        animationData={loadedAnimationData}
        style={style}
        loop={loop}
        autoplay={autoplay}
        speed={speed}
      />
    </div>
  );
}
