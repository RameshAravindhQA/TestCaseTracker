
import React, { useEffect, useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RefreshCw, Check, X, Upload, Download } from 'lucide-react';

interface LottieAvatarProps {
  animationData?: any;
  width?: number;
  height?: number;
  autoplay?: boolean;
  loop?: boolean;
  onAnimationComplete?: () => void;
  onAnimationError?: (error: any) => void;
  className?: string;
  controls?: boolean;
  previewMode?: boolean;
  onSelect?: () => void;
  selected?: boolean;
  name?: string;
  style?: React.CSSProperties;
}

export const LottieAvatar: React.FC<LottieAvatarProps> = ({
  animationData,
  width = 80,
  height = 80,
  autoplay = true,
  loop = true,
  onAnimationComplete,
  onAnimationError,
  className = "",
  controls = false,
  previewMode = false,
  onSelect,
  selected = false,
  name = "Animation",
  style = {}
}) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { toast } = useToast();

  // Handle animation loading
  useEffect(() => {
    if (animationData && lottieRef.current) {
      try {
        setIsLoaded(true);
        setHasError(false);
        setLoadingProgress(100);
        
        if (autoplay) {
          lottieRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error loading Lottie animation:', error);
        setHasError(true);
        setIsLoaded(false);
        onAnimationError?.(error);
      }
    }
  }, [animationData, autoplay, onAnimationError]);

  // Control functions
  const handlePlay = () => {
    if (lottieRef.current && !isPlaying) {
      lottieRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (lottieRef.current && isPlaying) {
      lottieRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (lottieRef.current) {
      lottieRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  // Event handlers
  const handleDataReady = () => {
    console.log(`✅ Lottie data ready: ${name}`);
    setIsLoaded(true);
    setLoadingProgress(100);
  };

  const handleComplete = () => {
    console.log(`🔄 Animation completed: ${name}`);
    onAnimationComplete?.();
    if (!loop) {
      setIsPlaying(false);
    }
  };

  const handleLoopComplete = () => {
    console.log(`🔁 Loop completed: ${name}`);
  };

  const handleError = (error: any) => {
    console.error(`❌ Lottie error for ${name}:`, error);
    setHasError(true);
    setIsLoaded(false);
    onAnimationError?.(error);
  };

  // Render error state
  if (hasError || !animationData) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed border-red-300 rounded-lg bg-red-50 ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center p-2">
          <X className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-red-600">Failed to load</p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center p-2">
          <RefreshCw className="w-6 h-6 text-gray-500 mx-auto mb-1 animate-spin" />
          <p className="text-xs text-gray-600">Loading...</p>
          {loadingProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Preview mode rendering
  if (previewMode) {
    return (
      <motion.div
        className={`relative cursor-pointer rounded-lg border-2 transition-all duration-300 ${
          selected 
            ? 'border-primary bg-primary/5 shadow-lg' 
            : 'border-gray-200 hover:border-primary/50 hover:shadow-md'
        } ${className}`}
        onClick={onSelect}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={style}
      >
        <div className="p-4">
          <div className="flex items-center justify-center mb-2" style={{ width, height }}>
            <Lottie
              lottieRef={lottieRef}
              animationData={animationData}
              autoplay={autoplay}
              loop={loop}
              style={{ width: '100%', height: '100%' }}
              onDataReady={handleDataReady}
              onComplete={handleComplete}
              onLoopComplete={handleLoopComplete}
              onError={handleError}
              renderer="svg"
              rendererSettings={{
                preserveAspectRatio: 'xMidYMid meet',
                clearCanvas: true,
                progressiveLoad: false,
                hideOnTransparent: true
              }}
            />
          </div>
          
          <p className="text-sm font-medium text-center truncate">{name}</p>
          
          {controls && (
            <div className="flex justify-center mt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
            </div>
          )}
          
          {selected && (
            <div className="absolute top-2 right-2">
              <Badge variant="default" className="bg-primary">
                <Check className="w-3 h-3 mr-1" />
                Selected
              </Badge>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Regular mode rendering
  return (
    <div className={`relative ${className}`} style={style}>
      <div style={{ width, height }}>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          autoplay={autoplay}
          loop={loop}
          style={{ width: '100%', height: '100%' }}
          onDataReady={handleDataReady}
          onComplete={handleComplete}
          onLoopComplete={handleLoopComplete}
          onError={handleError}
          renderer="svg"
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet',
            clearCanvas: true,
            progressiveLoad: false,
            hideOnTransparent: true
          }}
        />
      </div>
      
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm rounded-b-lg p-1">
          <div className="flex justify-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRestart}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Status indicator */}
      <div className="absolute top-1 right-1">
        <div className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-green-500' : 'bg-yellow-500'}`} />
      </div>
    </div>
  );
};

// Export additional components for specific use cases
export const LottieAvatarGrid: React.FC<{
  animations: Array<{
    id: string;
    name: string;
    data: any;
    selected?: boolean;
    onSelect?: () => void;
  }>;
  gridCols?: number;
  itemWidth?: number;
  itemHeight?: number;
  showControls?: boolean;
}> = ({ 
  animations, 
  gridCols = 4, 
  itemWidth = 80, 
  itemHeight = 80,
  showControls = true 
}) => {
  return (
    <div className={`grid gap-4 grid-cols-1 md:grid-cols-${Math.min(gridCols, 4)}`}>
      {animations.map((animation) => (
        <LottieAvatar
          key={animation.id}
          animationData={animation.data}
          name={animation.name}
          width={itemWidth}
          height={itemHeight}
          previewMode={true}
          selected={animation.selected}
          onSelect={animation.onSelect}
          controls={showControls}
          className="transition-all duration-300"
        />
      ))}
    </div>
  );
};

export default LottieAvatar;
