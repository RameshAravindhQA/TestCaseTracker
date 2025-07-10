"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { User } from "@/types"
import { useStableAvatar } from "@/hooks/use-stable-avatar"

interface StaticAvatarProps {
  user: User | null | undefined;
  className?: string;
  fallbackClassName?: string;
}

/**
 * A statically memoized avatar component that never changes
 * after initial render. This is a simplified version of FrozenAvatar
 * that uses React.memo to prevent re-renders.
 */
export const StaticAvatar = React.memo(({ user, className, fallbackClassName }: StaticAvatarProps) => {
  // Get stable avatar information that doesn't change
  const { avatarUrl, userInitials, hasImage } = useStableAvatar(user);
  
  return (
    <Avatar className={className}>
      {hasImage && avatarUrl && (
        <AvatarImage 
          src={avatarUrl}
          alt={user?.name || "User"}
        />
      )}
      
      <AvatarFallback 
        className={fallbackClassName}
      >
        {userInitials}
      </AvatarFallback>
    </Avatar>
  );
}, () => true); // Always return true to skip all re-renders