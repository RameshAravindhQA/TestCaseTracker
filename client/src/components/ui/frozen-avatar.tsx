import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types";
import { cn } from "@/lib/utils";

interface FrozenAvatarProps {
  user?: User;
  className?: string;
  fallbackClassName?: string;
}

export function FrozenAvatar({ user, className, fallbackClassName }: FrozenAvatarProps) {
  const [frozenData, setFrozenData] = useState<{
    initials: string;
    profilePicture?: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      const initials = (user.firstName?.charAt(0)?.toUpperCase() || '') + 
                     (user.lastName?.charAt(0)?.toUpperCase() || '') || 
                     user.name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 
                     "U";

      // Always update if profile picture has changed or is new
      const newProfilePicture = user.profilePicture ? `${user.profilePicture}?t=${Date.now()}` : undefined;

      if (!frozenData || frozenData.profilePicture !== newProfilePicture) {
        setFrozenData({
          initials,
          profilePicture: newProfilePicture,
          timestamp: Date.now(),
        });
      }
    }
  }, [user?.profilePicture, user?.firstName, user?.lastName, user?.name]);

  if (!frozenData) {
    return (
      <Avatar className={className}>
        <AvatarFallback className={fallbackClassName}>
          U
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={className}>
      <AvatarImage 
        src={frozenData.profilePicture} 
        alt={user?.name || "User Avatar"}
        key={frozenData.timestamp} // Force re-render when timestamp changes
      />
      <AvatarFallback className={fallbackClassName}>
        {frozenData.initials}
      </AvatarFallback>
    </Avatar>
  );
}