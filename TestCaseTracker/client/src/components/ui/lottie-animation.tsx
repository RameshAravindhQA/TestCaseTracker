
import React from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  animationData: any;
  className?: string;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
}

export function LottieAnimation({ 
  animationData, 
  className = '', 
  width = 200, 
  height = 200, 
  loop = true, 
  autoplay = true 
}: LottieAnimationProps) {
  const style = {
    width: width,
    height: height,
  };

  return (
    <div className={className}>
      <Lottie
        animationData={animationData}
        style={style}
        loop={loop}
        autoplay={autoplay}
      />
    </div>
  );
}
