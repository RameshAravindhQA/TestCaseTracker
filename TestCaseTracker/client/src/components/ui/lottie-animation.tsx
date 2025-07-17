import React, { useEffect, useRef, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface LottieAnimationProps {
  animationData?: any;
  path?: string;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  animationData,
  path,
  width = 100,
  height = 100,
  loop = true,
  autoplay = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadAnimation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If we have animation data directly, use it
        if (animationData) {
          animationRef.current = lottie.loadAnimation({
            container: containerRef.current!,
            renderer: 'svg',
            loop,
            autoplay,
            animationData,
          });
          setIsLoading(false);
          return;
        }

        // If we have a path, fetch the animation data
        if (path) {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to load animation: ${response.status}`);
          }

          const text = await response.text();

          // Check if response is HTML (error page)
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            throw new Error('Animation file not found - received HTML instead of JSON');
          }

          let jsonData;
          try {
            jsonData = JSON.parse(text);
          } catch (parseError) {
            throw new Error('Invalid JSON in animation file');
          }

          animationRef.current = lottie.loadAnimation({
            container: containerRef.current!,
            renderer: 'svg',
            loop,
            autoplay,
            animationData: jsonData,
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Lottie animation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load animation');
        setIsLoading(false);
      }
    };

    loadAnimation();

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, [animationData, path, loop, autoplay]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-gray-500 text-center p-2">Animation unavailable</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded animate-pulse ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
    />
  );
};