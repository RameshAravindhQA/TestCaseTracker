
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Download, Upload } from 'lucide-react';

interface LottieAvatarProps {
  width?: number;
  height?: number;
  className?: string;
  showControls?: boolean;
  animationData?: any;
  animationUrl?: string;
  onAnimationComplete?: () => void;
}

const PRESET_ANIMATIONS = [
  {
    id: 'female-avatar',
    name: 'Female Avatar',
    url: '/lottie/female-avatar.json',
    category: 'People'
  },
  {
    id: 'male-avatar',
    name: 'Male Avatar',
    url: '/lottie/male-avatar.json',
    category: 'People'
  },
  {
    id: 'businessman-rocket',
    name: 'Businessman Rocket',
    url: '/lottie/businessman-rocket.json',
    category: 'Business'
  },
  {
    id: 'business-team',
    name: 'Business Team',
    url: '/lottie/business-team.json',
    category: 'Team'
  },
  {
    id: 'office-team',
    name: 'Office Team',
    url: '/lottie/office-team.json',
    category: 'Team'
  },
  {
    id: 'software-dev',
    name: 'Software Developer',
    url: '/lottie/software-dev.json',
    category: 'Tech'
  },
  {
    id: 'rocket',
    name: 'Rocket Launch',
    url: '/lottie/rocket.json',
    category: 'Fun'
  }
];

export function LottieAvatar({ 
  width = 200, 
  height = 200, 
  className = '',
  showControls = true,
  animationData,
  animationUrl,
  onAnimationComplete
}: LottieAvatarProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<string>('female-avatar');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentAnimation, setCurrentAnimation] = useState<any>(null);
  const [animationError, setAnimationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load animation data
  useEffect(() => {
    const loadAnimation = async () => {
      setIsLoading(true);
      setAnimationError(null);
      
      try {
        if (animationData) {
          setCurrentAnimation(animationData);
        } else if (animationUrl) {
          const response = await fetch(animationUrl);
          if (!response.ok) throw new Error('Failed to load animation');
          const data = await response.json();
          setCurrentAnimation(data);
        } else {
          const preset = PRESET_ANIMATIONS.find(a => a.id === selectedAnimation);
          if (preset) {
            const response = await fetch(preset.url);
            if (!response.ok) throw new Error('Failed to load preset animation');
            const data = await response.json();
            setCurrentAnimation(data);
          }
        }
      } catch (error) {
        console.error('Error loading animation:', error);
        setAnimationError('Failed to load animation');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnimation();
  }, [animationData, animationUrl, selectedAnimation]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 100);
  };

  const handleAnimationChange = (animationId: string) => {
    setSelectedAnimation(animationId);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        setCurrentAnimation(data);
        setAnimationError(null);
      } catch (error) {
        setAnimationError('Invalid Lottie JSON file');
      }
    }
  };

  const downloadAnimation = () => {
    if (currentAnimation) {
      const dataStr = JSON.stringify(currentAnimation, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `${selectedAnimation}-animation.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const categories = [...new Set(PRESET_ANIMATIONS.map(a => a.category))];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Animation Display */}
      <Card className="p-4">
        <div className="flex justify-center items-center" style={{ width, height }}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </motion.div>
            ) : animationError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-center"
              >
                {animationError}
              </motion.div>
            ) : currentAnimation ? (
              <motion.div
                key={selectedAnimation}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex items-center justify-center"
              >
                <Player
                  autoplay={isPlaying}
                  loop
                  src={currentAnimation}
                  style={{ width: '100%', height: '100%' }}
                  onEvent={(event) => {
                    if (event === 'complete' && onAnimationComplete) {
                      onAnimationComplete();
                    }
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-500 text-center"
              >
                No animation selected
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Controls */}
      {showControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Avatar Animation Controls
              <Badge variant="outline">{selectedAnimation}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Animation Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Choose Animation:</label>
              <Select value={selectedAnimation} onValueChange={handleAnimationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an animation" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <div key={category}>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100">
                        {category}
                      </div>
                      {PRESET_ANIMATIONS
                        .filter(a => a.category === category)
                        .map(animation => (
                          <SelectItem key={animation.id} value={animation.id}>
                            {animation.name}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Playback Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                disabled={!currentAnimation}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!currentAnimation}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAnimation}
                disabled={!currentAnimation}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Custom Animation:</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="lottie-upload"
                />
                <label
                  htmlFor="lottie-upload"
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                  Choose Lottie JSON
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LottieAvatar;
