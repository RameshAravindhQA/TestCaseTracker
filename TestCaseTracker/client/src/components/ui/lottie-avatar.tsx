import React, { useRef, useState, useEffect, useCallback } from 'react';
import Lottie from 'lottie-react';
import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const lottieRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [animationKey, setAnimationKey] = useState(0); // Force re-render key
  const { toast } = useToast();

  // Validate animation data
  const validateAnimationData = useCallback((data: any): boolean => {
    if (!data || typeof data !== 'object') {
      setErrorMessage('Invalid animation data: not an object');
      return false;
    }

    const hasVersion = data.v || data.version;
    const hasLayers = data.layers && Array.isArray(data.layers);

    if (!hasVersion) {
      setErrorMessage('Invalid Lottie: missing version');
      return false;
    }

    if (!hasLayers) {
      setErrorMessage(`Invalid Lottie: missing layers (${name})`);
      return false;
    }

    // Ensure required properties exist
    if (!data.w && !data.width) data.w = width || 100;
    if (!data.h && !data.height) data.h = height || 100;
    if (!data.fr && !data.frameRate) data.fr = 30;
    if (data.ip === undefined) data.ip = 0;
    if (data.op === undefined) data.op = data.frames || 60;
    if (data.ddd === undefined) data.ddd = 0;
    if (!data.assets) data.assets = [];

    return true;
  }, [width, height, name]);

  // Handle animation data changes
  useEffect(() => {
    if (animationData) {
      setHasError(false);
      setErrorMessage('');

      const isValid = validateAnimationData(animationData);
      if (!isValid) {
        setHasError(true);
        onAnimationError?.(new Error(errorMessage));
        return;
      }

      setIsLoaded(true);
      setAnimationKey(prev => prev + 1); // Force re-render
      console.log(`✅ Lottie animation "${name}" loaded successfully`);
    }
  }, [animationData, validateAnimationData, errorMessage, onAnimationError, name]);

  // Animation event handlers
  const handleAnimationComplete = useCallback(() => {
    console.log(`🎬 Animation "${name}" completed`);
    onAnimationComplete?.();
  }, [name, onAnimationComplete]);

  const handleAnimationError = useCallback((error: any) => {
    console.error(`🎬 Animation "${name}" error:`, error);
    setHasError(true);
    setErrorMessage(error.message || 'Animation playback error');
    onAnimationError?.(error);
  }, [name, onAnimationError]);

  const handlePlay = useCallback(() => {
    if (lottieRef.current) {
      try {
        lottieRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        handleAnimationError(error);
      }
    }
  }, [handleAnimationError]);

  const handlePause = useCallback(() => {
    if (lottieRef.current) {
      try {
        lottieRef.current.pause();
        setIsPlaying(false);
      } catch (error) {
        handleAnimationError(error);
      }
    }
  }, [handleAnimationError]);

  const handleRestart = useCallback(() => {
    if (lottieRef.current) {
      try {
        lottieRef.current.goToAndPlay(0);
        setIsPlaying(true);
      } catch (error) {
        handleAnimationError(error);
      }
    }
  }, [handleAnimationError]);

  const handleSelect = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onSelect) {
      onSelect();
      console.log(`🎭 Selected animation: ${name}`);
    }
  }, [onSelect, name]);

  // Render loading state
  if (!animationData) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center p-2">
          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (hasError || !animationData) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded ${className}`}
        style={{ width, height, ...style }}
        onClick={onSelect}
      >
        <div className="text-center p-1">
          <XCircle className="h-3 w-3 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-red-600 dark:text-red-400 truncate">
            Failed
          </p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div
      key={animationKey}
      className={`relative ${className}`}
      style={style}
    >
      {/* Preview mode wrapper */}
      {previewMode ? (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`cursor-pointer border-2 rounded-lg p-2 transition-all duration-200 ${
            selected 
              ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' 
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
          onClick={handleSelect}
        >
          <div className="relative bg-white rounded overflow-hidden">
            <Lottie
              key={`${animationKey}-${name}`}
              lottieRef={lottieRef}
              animationData={animationData}
              style={{ width, height }}
              loop={loop}
              autoplay={autoplay && isPlaying}
              onComplete={handleAnimationComplete}
              onError={handleAnimationError}
              rendererSettings={{
                preserveAspectRatio: 'xMidYMid meet',
                clearCanvas: false,
                progressiveLoad: false,
                hideOnTransparent: true
              }}
            />
            {selected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-center mt-1 truncate font-medium" title={name}>
            {name}
          </p>
        </motion.div>
      ) : (
        /* Normal mode */
        <div className="relative">
          <Lottie
            key={`${animationKey}-${name}`}
            lottieRef={lottieRef}
            animationData={animationData}
            style={{ width, height }}
            loop={loop}
            autoplay={autoplay && isPlaying}
            onComplete={handleAnimationComplete}
            onError={handleAnimationError}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid meet',
              clearCanvas: false,
              progressiveLoad: false,
              hideOnTransparent: true
            }}
          />

          {/* Controls overlay */}
          <AnimatePresence>
            {controls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 bg-black/50 rounded-b-lg p-1"
              >
                <div className="flex items-center justify-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestart}
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// Grid component for displaying multiple animations
export const LottieAvatarGrid: React.FC<{
  animations?: Array<{
    id: string;
    name: string;
    preview: any;
    selected?: boolean;
    onSelect?: () => void;
  }>;
  gridCols?: number;
  itemWidth?: number;
  itemHeight?: number;
  showControls?: boolean;
  // Legacy props for backward compatibility
  animationData?: any;
  isPlaying?: boolean;
  isPaused?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
  animationId?: string;
  users?: any[];
}> = ({ 
  animations = [], 
  gridCols = 4, 
  itemWidth = 80, 
  itemHeight = 80,
  showControls = true,
  // Legacy props
  animationData,
  isPlaying,
  isPaused,
  onClick,
  isSelected,
  onMouseEnter,
  onMouseLeave,
  style,
  animationId,
  users = []
}) => {
  // Handle legacy usage where individual animation props are passed
  if (animationData && animationId) {
    return (
      <div style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <LottieAvatar
          key={animationId}
          animationData={animationData}
          name={animationId}
          width={itemWidth}
          height={itemHeight}
          previewMode={true}
          selected={isSelected}
          onSelect={onClick}
          autoplay={isPlaying}
          controls={showControls}
          className="transition-all duration-200"
        />
      </div>
    );
  }

  // Handle modern usage with animations array
  if (!animations || animations.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No animations available</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-${Math.min(gridCols, 6)}`}>
      {animations.map((animation) => (
        <LottieAvatar
          key={animation.id}
          animationData={animation.preview}
          name={animation.name}
          width={itemWidth}
          height={itemHeight}
          previewMode={true}
          selected={animation.selected}
          onSelect={animation.onSelect}
          controls={showControls}
          className="transition-all duration-200"
        />
      ))}
    </div>
  );
};

export default LottieAvatar;