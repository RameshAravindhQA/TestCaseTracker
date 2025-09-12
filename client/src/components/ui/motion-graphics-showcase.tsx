
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { LottieAnimation } from './lottie-animation';
import { Play, Pause, RotateCcw, Sparkles, Zap, Heart, Star } from 'lucide-react';

// Advanced motion graphics variants
const motionVariants = {
  // Particle system effect
  particles: {
    initial: { scale: 0, opacity: 0 },
    animate: (i: number) => ({
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      x: Math.sin(i * 0.5) * 100,
      y: Math.cos(i * 0.5) * 100,
      transition: {
        duration: 2,
        repeat: Infinity,
        delay: i * 0.1,
        ease: "easeInOut"
      }
    })
  },

  // Morphing shapes
  morphing: {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2, ease: "easeInOut" },
        opacity: { duration: 0.5 }
      }
    }
  },

  // 3D rotation effect
  rotation3D: {
    initial: { rotateX: 0, rotateY: 0, rotateZ: 0 },
    animate: {
      rotateX: [0, 360],
      rotateY: [0, 180],
      rotateZ: [0, 90],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "linear"
      }
    }
  },

  // Liquid motion
  liquid: {
    initial: { scale: 1, borderRadius: "20%" },
    animate: {
      scale: [1, 1.2, 0.8, 1],
      borderRadius: ["20%", "50%", "30%", "20%"],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Magnetic effect
  magnetic: {
    initial: { x: 0, y: 0 },
    animate: (mousePos: { x: number; y: number }) => ({
      x: mousePos.x * 0.1,
      y: mousePos.y * 0.1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    })
  }
};

export const MotionGraphicsShowcase: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('particles');
  const [isPlaying, setIsPlaying] = useState(true);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const constraintsRef = useRef(null);

  // Mouse tracking for magnetic effect
  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left - rect.width / 2);
    mouseY.set(event.clientY - rect.top - rect.height / 2);
  };

  // Particle system component
  const ParticleSystem = () => (
    <div className="relative w-full h-64 overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-lg">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={motionVariants.particles}
          initial="initial"
          animate={isPlaying ? "animate" : "initial"}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            left: '50%',
            top: '50%',
            filter: 'blur(0.5px)',
            boxShadow: '0 0 10px rgba(255,255,255,0.8)'
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-white text-xl font-bold"
        >
          Motion Graphics
        </motion.div>
      </div>
    </div>
  );

  // Morphing SVG shapes
  const MorphingShapes = () => (
    <div className="w-full h-64 bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900 rounded-lg flex items-center justify-center">
      <motion.svg width="200" height="200" viewBox="0 0 200 200">
        <motion.path
          d="M 100 20 L 180 100 L 100 180 L 20 100 Z"
          fill="none"
          stroke="white"
          strokeWidth="3"
          variants={motionVariants.morphing}
          initial="initial"
          animate={isPlaying ? "animate" : "initial"}
        />
        <motion.circle
          cx="100"
          cy="100"
          r="50"
          fill="rgba(255,255,255,0.1)"
          animate={{
            r: [30, 60, 30],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.svg>
    </div>
  );

  // 3D rotating cube
  const Rotating3D = () => (
    <div className="w-full h-64 bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 rounded-lg flex items-center justify-center perspective-1000">
      <motion.div
        variants={motionVariants.rotation3D}
        initial="initial"
        animate={isPlaying ? "animate" : "initial"}
        className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-2xl"
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: '0 0 50px rgba(255,255,255,0.3)'
        }}
      />
    </div>
  );

  // Liquid motion effect
  const LiquidMotion = () => (
    <div className="w-full h-64 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 rounded-lg flex items-center justify-center">
      <motion.div
        variants={motionVariants.liquid}
        initial="initial"
        animate={isPlaying ? "animate" : "initial"}
        className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500"
        style={{
          filter: 'blur(1px)',
          boxShadow: '0 0 30px rgba(0,255,255,0.5)'
        }}
      />
    </div>
  );

  // Magnetic interaction
  const MagneticEffect = () => (
    <div 
      ref={constraintsRef}
      className="w-full h-64 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-lg flex items-center justify-center cursor-none"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        animate={{
          x: mouseX,
          y: mouseY
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-16 h-16 bg-gradient-to-br from-white to-gray-300 rounded-full shadow-2xl"
        style={{
          boxShadow: '0 0 40px rgba(255,255,255,0.8)'
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white text-sm opacity-70">Move your mouse</span>
      </div>
    </div>
  );

  const demos = {
    particles: { component: ParticleSystem, title: "Particle System", icon: Sparkles },
    morphing: { component: MorphingShapes, title: "Morphing Shapes", icon: Zap },
    rotation3d: { component: Rotating3D, title: "3D Rotation", icon: RotateCcw },
    liquid: { component: LiquidMotion, title: "Liquid Motion", icon: Heart },
    magnetic: { component: MagneticEffect, title: "Magnetic Effect", icon: Star }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Motion Graphics Showcase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demo Selection */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(demos).map(([key, demo]) => {
              const IconComponent = demo.icon;
              return (
                <Button
                  key={key}
                  variant={activeDemo === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveDemo(key)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {demo.title}
                </Button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Badge variant="secondary">
              {demos[activeDemo as keyof typeof demos].title}
            </Badge>
          </div>

          {/* Active Demo */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDemo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {React.createElement(demos[activeDemo as keyof typeof demos].component)}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default MotionGraphicsShowcase;
