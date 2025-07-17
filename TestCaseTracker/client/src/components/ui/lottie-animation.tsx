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
          console.log('🎬 Loading Lottie animation from:', path);

          // Construct proper path for Lottie files - try multiple paths
          const possiblePaths = [
            path, // Try original path first
            path.startsWith('/lottie/') ? path : `/lottie/${path.replace('/lottie/', '')}`,
            path.startsWith('/public/lottie/') ? path.replace('/public', '') : `/lottie/${path.replace('/public/lottie/', '')}`,
            path.endsWith('.json') ? path : `${path}.json`
          ];

          let response = null;
          let successfulPath = null;

          for (const tryPath of possiblePaths) {
            try {
              console.log('🎬 Trying animation path:', tryPath);
              response = await fetch(tryPath);
              if (response.ok) {
                successfulPath = tryPath;
                console.log('✅ Animation loaded from:', successfulPath);
                break;
              } else {
                console.log(`❌ Failed to load from ${tryPath}: ${response.status}`);
              }
            } catch (err) {
              console.log('🎬 Path failed:', tryPath, err instanceof Error ? err.message : 'Unknown error');
            }
          }

          if (!response || !response.ok) {
            console.error(`❌ Failed to fetch animation from any path`);
            throw new Error(`Failed to load animation from any attempted path`);
          }

          console.log('🎬 Successfully loaded from:', successfulPath);

          const contentType = response.headers.get('content-type');
          console.log('📁 Response content type:', contentType);

          const text = await response.text();
          console.log('📄 Response text preview:', text.substring(0, 100));

          // Check if response is HTML (error page)
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            console.error('❌ Received HTML instead of JSON for Lottie animation');
            // Try alternative path
            const altPath = `/public/lottie/${path.replace('/lottie/', '')}`;
            console.log('🔄 Trying alternative path:', altPath);

            const altResponse = await fetch(altPath);
            if (!altResponse.ok) {
              throw new Error('Animation file not found in any location');
            }

            const altText = await altResponse.text();
            if (altText.trim().startsWith('<!DOCTYPE') || altText.trim().startsWith('<html')) {
              throw new Error('Animation file not found - received HTML instead of JSON');
            }

            // Use the alternative response
            const altJsonData = JSON.parse(altText);
            animationRef.current = lottie.loadAnimation({
              container: containerRef.current!,
              renderer: 'svg',
              loop,
              autoplay,
              animationData: altJsonData,
            });
            setIsLoading(false);
            return;
          }

          let jsonData;
          try {
            jsonData = JSON.parse(text);
            console.log('✅ Successfully parsed Lottie JSON data');
          } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            throw new Error('Invalid JSON in animation file');
          }

          if (!jsonData.v || !jsonData.layers) {
            console.error('❌ Invalid Lottie format - missing required properties');
            throw new Error('Invalid Lottie animation format');
          }

          animationRef.current = lottie.loadAnimation({
            container: containerRef.current!,
            renderer: 'svg',
            loop,
            autoplay,
            animationData: jsonData,
          });

          console.log('🎬 Lottie animation loaded successfully');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('🎬 Lottie animation error:', err);
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