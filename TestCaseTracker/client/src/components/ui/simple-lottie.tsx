
import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';

interface SimpleLottieProps {
  fileName: string;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

export const SimpleLottie: React.FC<SimpleLottieProps> = ({
  fileName,
  width = 100,
  height = 100,
  loop = true,
  autoplay = true,
  className = ''
}) => {
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Direct path - files in public/lottie are served at /lottie/
        const path = `/lottie/${fileName.replace('.json', '')}.json`;
        console.log(`🎬 Loading Lottie: ${path}`);
        
        const response = await fetch(path);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Basic validation
        if (!data.v && !data.version) {
          throw new Error('Invalid Lottie file format');
        }
        
        setAnimationData(data);
        console.log(`✅ Lottie loaded: ${fileName}`);
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ Failed to load ${fileName}:`, err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (fileName) {
      loadAnimation();
    }
  }, [fileName]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-xs text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !animationData) {
    return (
      <div className={`flex items-center justify-center border border-dashed border-red-300 bg-red-50 ${className}`} style={{ width, height }}>
        <div className="text-center">
          <div className="text-red-500 text-xs">❌</div>
          <div className="text-red-600 text-xs">Failed</div>
        </div>
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
      />
    </div>
  );
};
