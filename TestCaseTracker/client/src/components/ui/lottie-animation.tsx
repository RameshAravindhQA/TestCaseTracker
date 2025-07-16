
import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  animationPath: string;
  width?: number;
  height?: number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export function LottieAnimation({
  animationPath,
  width = 100,
  height = 100,
  className = '',
  loop = true,
  autoplay = true
}: LottieAnimationProps) {
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🎬 Loading Lottie animation from: ${animationPath}`);

        // Handle blob URLs (from uploaded files)
        if (animationPath.startsWith('blob:')) {
          console.log(`📄 Loading from blob URL: ${animationPath}`);
          try {
            const response = await fetch(animationPath);
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log(`✅ Successfully loaded Lottie from blob: ${animationPath}`);
            setAnimationData(data);
            return;
          } catch (blobError) {
            console.error('❌ Error loading from blob:', blobError);
            throw blobError;
          }
        }

        // Handle regular file paths
        const response = await fetch(animationPath);
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        console.log(`📄 Loaded animation text length: ${text.length}`);

        // Try to parse JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          throw new Error('Invalid JSON format in animation file');
        }

        // Basic Lottie validation - more lenient
        if (!data || typeof data !== 'object') {
          throw new Error('Animation data is not a valid object');
        }

        // Check for essential Lottie properties (more flexible)
        if (!data.v && !data.version) {
          console.warn('⚠️ Animation missing version property, but continuing...');
        }

        if (!data.layers && !data.assets) {
          console.warn('⚠️ Animation missing layers and assets, but attempting to render...');
        }

        console.log(`✅ Successfully loaded Lottie animation: ${animationPath}`);
        console.log(`📊 Animation details:`, {
          version: data.v || data.version,
          hasLayers: !!data.layers,
          layerCount: data.layers?.length || 0,
          hasAssets: !!data.assets,
          frameRate: data.fr,
          width: data.w,
          height: data.h
        });
        
        setAnimationData(data);
      } catch (err) {
        console.error('❌ Error loading Lottie animation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load animation';
        console.error('❌ Full error details:', {
          message: errorMessage,
          animationPath,
          error: err
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (animationPath) {
      loadAnimation();
    } else {
      console.warn('⚠️ No animation path provided');
      setError('No animation path provided');
      setLoading(false);
    }
  }, [animationPath]);

  if (loading) {
    console.log(`⏳ Loading animation: ${animationPath}`);
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !animationData) {
    console.error(`❌ Rendering error state for: ${animationPath}`, { error, hasData: !!animationData });
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 dark:text-gray-400 text-xs text-center p-2">
          {error || 'Animation not available'}
        </span>
      </div>
    );
  }

  console.log(`🎬 Rendering Lottie animation: ${animationPath}`);
  
  return (
    <div className={className} style={{ width, height }}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
        onError={(error) => {
          console.error('❌ Lottie render error:', error);
          setError('Failed to render animation');
        }}
        onComplete={() => {
          console.log(`✅ Lottie animation completed: ${animationPath}`);
        }}
        onLoopComplete={() => {
          console.log(`🔄 Lottie animation loop completed: ${animationPath}`);
        }}
      />
    </div>
  );
}
