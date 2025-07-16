
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
          throw new Error('Invalid Lottie file: Missing layers and assets');
        }

        console.log(`✅ Successfully loaded Lottie animation: ${animationPath}`);
        setAnimationData(data);
      } catch (err) {
        console.error('❌ Error loading Lottie animation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load animation');
      } finally {
        setLoading(false);
      }
    };

    if (animationPath) {
      loadAnimation();
    }
  }, [animationPath]);

  if (loading) {
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
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 rounded ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-xs text-center p-2">
          {error || 'Animation not available'}
        </span>
      </div>
    );
  }

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
      />
    </div>
  );
}
