"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { User } from "@/types"

interface UserAvatarProps {
  user: User | null | undefined;
  className?: string;
  fallbackClassName?: string;
}

export const UserAvatar = React.memo(({ user, className, fallbackClassName }: UserAvatarProps) => {
  // Create stable keys that don't change with re-renders
  const avatarCacheKey = React.useMemo(() => {
    // Generate a stable key based on the username or user id to avoid frequent changes
    return user?.id ? `user_${user.id}` : user?.name ? user.name.replace(/\s+/g, '_') : Date.now().toString();
  }, [user?.id, user?.name])
  
  const [isLoading, setIsLoading] = React.useState(!!user?.profilePicture)
  const [imageError, setImageError] = React.useState(false)
  
  // Generate user initials for the fallback
  const userInitials = React.useMemo(() => {
    if (!user?.name) return "U"
    return user.name.split(' ').map(name => name.charAt(0).toUpperCase()).join('')
  }, [user?.name])
  
  // Only show image if there's a profile picture and no loading error
  const showImage = user?.profilePicture && !imageError
  
  // Preload the image when the component mounts or when the profile picture changes
  React.useEffect(() => {
    if (user?.profilePicture) {
      setIsLoading(true);
      const img = new Image();
      const cacheBustedUrl = `${user.profilePicture}?cache=${avatarCacheKey}`;
      img.src = cacheBustedUrl;
      
      img.onload = () => {
        setIsLoading(false);
        setImageError(false);
      };
      
      img.onerror = () => {
        console.error("Avatar image failed to preload");
        setImageError(true);
        setIsLoading(false);
      };
      
      // Cleanup
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    } else {
      setIsLoading(false);
    }
  }, [user?.profilePicture, avatarCacheKey]);
  
  return (
    <Avatar className={className}>
      {showImage && (
        <AvatarImage 
          src={`${user.profilePicture}?cache=${avatarCacheKey}`}
          alt={user?.name || "User"}
          className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-200"}
          onError={() => {
            console.error("Avatar image failed to load");
            setImageError(true);
          }}
        />
      )}
      
      <AvatarFallback 
        className={fallbackClassName}
        delayMs={isLoading ? 0 : 600}
      >
        {userInitials}
      </AvatarFallback>
    </Avatar>
  )
}, (prevProps, nextProps) => {
  // Compare only the necessary parts of the user object to avoid unnecessary re-renders
  return (
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.user?.name === nextProps.user?.name &&
    prevProps.user?.profilePicture === nextProps.user?.profilePicture &&
    prevProps.className === nextProps.className &&
    prevProps.fallbackClassName === nextProps.fallbackClassName
  );
});