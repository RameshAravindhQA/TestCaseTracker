
import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollContainerProps {
  children: ReactNode;
  className?: string;
  showScrollIndicators?: boolean;
  showProgressBar?: boolean;
  progressBarClassName?: string;
}

export function ScrollContainer({
  children,
  className,
  showScrollIndicators = true,
  showProgressBar = true,
  progressBarClassName
}: ScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const scrollableHeight = scrollHeight - clientHeight;
      
      // Calculate scroll progress
      const progress = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;
      setScrollProgress(progress);
      
      // Show/hide scroll buttons
      setShowScrollTop(scrollTop > 100);
      setShowScrollDown(scrollTop < scrollableHeight - 100);
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative h-full">
      {/* Progress Bar */}
      {showProgressBar && (
        <div className={cn(
          "absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-30",
          progressBarClassName
        )}>
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className={cn(
          "h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-600 scroll-smooth scroll-container",
          className
        )}
      >
        {children}
      </div>

      {/* Scroll Indicators */}
      {showScrollIndicators && (
        <>
          {showScrollTop && (
            <Button
              onClick={scrollToTop}
              className="absolute bottom-20 right-6 z-20 rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
              size="icon"
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
          )}

          {showScrollDown && (
            <Button
              onClick={scrollToBottom}
              className="absolute bottom-6 right-6 z-20 rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
              size="icon"
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
