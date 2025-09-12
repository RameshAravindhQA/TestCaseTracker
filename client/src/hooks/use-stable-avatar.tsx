import { useState, useEffect, useMemo } from 'react';
import { User } from "@/types";

type StableAvatarState = {
  avatarUrl: string | null;
  userInitials: string;
  hasImage: boolean;
};

/**
 * A hook that returns stable avatar information that doesn't change
 * after the initial render, preventing excessive re-renders and 
 * image flickering in components like the sidebar
 */
export function useStableAvatar(user: User | null | undefined): StableAvatarState {
  // Generate stable user ID that doesn't change
  const stableUserId = useMemo(() => {
    return user?.id || 'anonymous';
  }, []);
  
  // Create a truly stable cache key that never changes once set
  const stableCacheKey = useMemo(() => {
    return `stable_${stableUserId}`;
  }, [stableUserId]);
  
  // Use state to store the stable avatar info that won't change
  const [stableAvatarInfo, setStableAvatarInfo] = useState<StableAvatarState>({
    avatarUrl: null,
    userInitials: 'U',
    hasImage: false
  });

  // Only run this effect once when the component mounts
  useEffect(() => {
    if (!user) return;

    // Generate a stable initials
    const userInitials = user.name 
      ? user.name.split(' ').map(name => name.charAt(0).toUpperCase()).join('')
      : 'U';

    // Use the truly stable cache key that doesn't change between renders
    const avatarUrl = user.profilePicture 
      ? `${user.profilePicture}?${stableCacheKey}`
      : null;

    // Set the stable avatar info
    setStableAvatarInfo({
      avatarUrl,
      userInitials,
      hasImage: !!user.profilePicture
    });
    
    // This effect should never run again
  }, []);  // Empty dependency array means this runs once and never again

  return stableAvatarInfo;
}