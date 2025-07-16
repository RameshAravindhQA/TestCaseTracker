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

        // Load from regular URL with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          const response = await fetch(animationPath, { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });

          clearTimeout(timeoutId);

          console.log(`📡 Fetch response for ${animationPath}:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            contentType: response.headers.get('content-type')
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const text = await response.text();
          console.log(`📄 Received response, length: ${text.length}`);

          // Check if response is HTML (404/error page)
          if (text.trim().startsWith('<')) {
            throw new Error('Received HTML instead of JSON - file may not exist');
          }

          let data;
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error(`❌ JSON parse error for ${animationPath}:`, parseError);
            // Try to repair the JSON
            try {
              const repairedText = repairJSON(text);
              data = JSON.parse(repairedText);
              console.log(`🔧 Successfully repaired JSON for ${animationPath}`);
            } catch (repairError) {
              throw new Error(`Invalid JSON: ${parseError.message}`);
            }
          }

          // Validate basic Lottie structure
          if (!data.v && !data.version) {
            console.warn(`⚠️ No version found in ${animationPath}, but proceeding...`);
          }

          if (!data.layers) {
            throw new Error('Invalid Lottie format: missing layers');
          }

          console.log(`✅ Successfully loaded Lottie: ${animationPath}`, {
            version: data.v || data.version,
            layerCount: data.layers?.length,
            frameRate: data.fr,
            dimensions: `${data.w}x${data.h}`
          });

          setAnimationData(data);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        console.error(`❌ Failed to load Lottie animation ${animationPath}:`, error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    // Try to repair malformed JSON
    const repairJSON = (jsonString: string): string => {
      let repaired = jsonString.trim();

      // Remove any leading/trailing non-JSON characters
      const firstBrace = repaired.indexOf('{');
      const lastBrace = repaired.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No valid JSON structure found');
      }

      repaired = repaired.substring(firstBrace, lastBrace + 1);

      // Count braces and brackets to ensure they're balanced
      let openBraces = 0;
      let closeBraces = 0;
      let openBrackets = 0;
      let closeBrackets = 0;

      for (const char of repaired) {
        if (char === '{') openBraces++;
        else if (char === '}') closeBraces++;
        else if (char === '[') openBrackets++;
        else if (char === ']') closeBrackets++;
      }

      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repaired += '}';
      }

      // Add missing closing brackets
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repaired += ']';
      }

      return repaired;
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