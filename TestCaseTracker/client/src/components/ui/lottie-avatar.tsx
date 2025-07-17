
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Lottie from 'lottie-react';
import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  // Validate animation data
  const validateAnimationData = useCallback((data: any): boolean => {
    if (!data || typeof data !== 'object') {
      setErrorMessage('Invalid animation data: not an object');
      return false;
    }

    // More lenient validation for Lottie files
    const hasVersion = data.v || data.version;
    const hasLayers = data.layers;

    if (!hasVersion) {
      setErrorMessage('Invalid Lottie: missing version');
      return false;
    }

    if (!hasLayers) {
      setErrorMessage('Invalid Lottie: missing layers');
      return false;
    }

    // Set default values if missing
    if (!data.w && !data.width) data.w = width || 100;
    if (!data.h && !data.height) data.h = height || 100;
    if (!data.fr && !data.frameRate) data.fr = 30;
    if (data.ip === undefined) data.ip = 0;
    if (data.op === undefined) data.op = data.frames || 60;
    if (data.ddd === undefined) data.ddd = 0;
    if (!data.assets) data.assets = [];

    return true;
  }, [width, height]);

  // Handle animation data changes
  useEffect(() => {
    if (animationData) {
      setHasError(false);
      setErrorMessage('');
      setLoadingProgress(0);
      
      const isValid = validateAnimationData(animationData);
      if (!isValid) {
        setHasError(true);
        onAnimationError?.(new Error(errorMessage));
        return;
      }
      
      setIsLoaded(true);
      setLoadingProgress(100);
    }
  }, [animationData, validateAnimationData, errorMessage, onAnimationError]);

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

  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect();
      toast({
        title: "Animation Selected",
        description: `"${name}" has been selected as your avatar.`,
      });
    }
  }, [onSelect, name, toast]);

  // Render loading state
  if (!animationData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </motion.div>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center justify-center bg-destructive/10 border border-destructive/20 rounded-lg ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center p-2">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
          <p className="text-xs text-destructive">{errorMessage}</p>
          {controls && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHasError(false);
                setErrorMessage('');
              }}
              className="mt-2"
            >
              Retry
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // Main render
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`relative ${className}`}
      style={style}
    >
      {/* Preview mode wrapper */}
      {previewMode ? (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${
            selected 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-border hover:border-primary/50'
          }`}
          onClick={handleSelect}
        >
          <div className="relative">
            <Lottie
              lottieRef={lottieRef}
              animationData={animationData}
              style={{ width, height }}
              loop={loop}
              autoplay={autoplay && isPlaying}
              onComplete={handleAnimationComplete}
              onError={handleAnimationError}
            />
            {selected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-center mt-1 truncate" title={name}>
            {name}
          </p>
        </motion.div>
      ) : (
        /* Normal mode */
        <div className="relative">
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            style={{ width, height }}
            loop={loop}
            autoplay={autoplay && isPlaying}
            onComplete={handleAnimationComplete}
            onError={handleAnimationError}
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
    </motion.div>
  );
};

// Grid component for displaying multiple animations
export const LottieAvatarGrid: React.FC<{
  animations: Array<{
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
}> = ({ 
  animations, 
  gridCols = 4, 
  itemWidth = 80, 
  itemHeight = 80,
  showControls = true 
}) => {
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
