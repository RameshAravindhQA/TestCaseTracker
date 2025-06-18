"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { User } from "@/types"
import { useStableAvatar } from "@/hooks/use-stable-avatar"

interface FrozenAvatarProps {
  user: User | null | undefined;
  className?: string;
  fallbackClassName?: string;
}

/**
 * A special avatar component that "freezes" its state on first render
 * and never updates again, even if the user prop changes.
 * This prevents unnecessary re-renders and image flickering.
 */
export const FrozenAvatar = React.memo(function FrozenAvatarInner({ 
  user, 
  className, 
  fallbackClassName 
}: FrozenAvatarProps) {
  // Get stable avatar information that doesn't change
  const { avatarUrl, userInitials, hasImage } = useStableAvatar(user);
  
  // Cache loading state with a ref to avoid re-renders
  const imageLoadedRef = React.useRef(false);
  const [imageVisible, setImageVisible] = React.useState(false);
  
  // Pre-load the image to avoid flickering - only run once
  React.useEffect(() => {
    // If we already started loading, don't do it again
    if (imageLoadedRef.current) return;
    
    if (avatarUrl) {
      const img = new Image();
      img.src = avatarUrl;
      img.onload = () => {
        imageLoadedRef.current = true;
        setImageVisible(true);
      };
    }
  }, []);  // Empty dependency array - only run once
  
  // Memoize the avatar component to prevent re-renders
  return React.useMemo(() => (
    <Avatar className={className}>
      {hasImage && avatarUrl && (
        <AvatarImage 
          src={avatarUrl}
          alt={user?.name || "User"}
          className={imageVisible ? "opacity-100" : "opacity-0"}
        />
      )}
      
      <AvatarFallback 
        className={fallbackClassName}
      >
        {userInitials}
      </AvatarFallback>
    </Avatar>
  ), [className, fallbackClassName, hasImage, avatarUrl, imageVisible, userInitials]);
}, () => {
  // Always return true in the comparison function to prevent updates
  return true;
});