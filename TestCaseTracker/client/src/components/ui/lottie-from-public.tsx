
import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface LottieFromPublicProps {
  animationPath: string;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  onLoad?: (data: any) => void;
  onError?: (error: string) => void;
}

const LottieFromPublic: React.FC<LottieFromPublicProps> = ({
  animationPath,
  width = 300,
  height = 300,
  loop = true,
  autoplay = true,
  className = "",
  onLoad,
  onError
}) => {
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🎬 Loading Lottie from: ${animationPath}`);
        
        // Try multiple potential paths
        const pathsToTry = [
          animationPath,
          animationPath.startsWith('/') ? animationPath : `/${animationPath}`,
          animationPath.replace('/lottie/', '/public/lottie/'),
          `./public${animationPath}`,
        ];
        
        let response;
        let lastError;
        
        for (const pathToTry of pathsToTry) {
          try {
            console.log(`🔍 Trying path: ${pathToTry}`);
            response = await fetch(pathToTry, {
              cache: 'no-cache',
              headers: {
                'Accept': 'application/json',
              }
            });
            
            if (response.ok) {
              console.log(`✅ Found Lottie at: ${pathToTry}`);
              break;
            } else {
              console.log(`❌ Failed at ${pathToTry}: ${response.status}`);
            }
          } catch (fetchError) {
            console.log(`❌ Fetch error for ${pathToTry}:`, fetchError);
            lastError = fetchError;
            continue;
          }
        }
        
        if (!response || !response.ok) {
          throw new Error(`Failed to load from any path. Last error: ${lastError?.message || 'Unknown error'}`);
        }

        const text = await response.text();
        
        // Check if we got HTML instead of JSON (404 page)
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error('Animation file not found (received HTML instead of JSON)');
        }

        const data = JSON.parse(text);
        
        // Validate Lottie structure
        if (!data.v && !data.version) {
          throw new Error('Invalid Lottie format: missing version');
        }
        
        if (!data.layers || !Array.isArray(data.layers)) {
          throw new Error('Invalid Lottie format: missing layers');
        }

        console.log(`✅ Lottie loaded successfully: ${animationPath}`);
        setAnimationData(data);
        onLoad?.(data);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading animation';
        console.error(`❌ Failed to load Lottie from ${animationPath}:`, err);
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (animationPath) {
      loadAnimation();
    }
  }, [animationPath, onLoad, onError]);

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !animationData) {
    return (
      <div 
        className={`flex items-center justify-center border border-dashed border-red-300 bg-red-50 ${className}`}
        style={{ width, height }}
      >
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
        onError={(error) => {
          console.error('Lottie render error:', error);
          setError('Render error');
        }}
        onDataReady={() => {
          console.log(`🎭 Lottie ready: ${animationPath}`);
        }}
      />
    </div>
  );
};

export default LottieFromPublic;
