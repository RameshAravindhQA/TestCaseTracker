
import React, { useState } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VideoCallButtonProps {
  conversationId: string | number;
  participants: { id: number; name: string }[];
}

export const VideoCallButton: React.FC<VideoCallButtonProps> = ({ 
  conversationId, 
  participants 
}) => {
  const [isCallActive, setIsCallActive] = useState(false);

  const startVideoCall = () => {
    const roomName = `testtracker_${conversationId}_${Date.now()}`;
    const domain = 'meet.jit.si';
    
    // Create Jitsi Meet URL
    const jitsiUrl = `https://${domain}/${roomName}`;
    
    // Open in new window
    const callWindow = window.open(
      jitsiUrl,
      'jitsi-call',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    setIsCallActive(true);

    // Monitor when call window is closed
    const checkClosed = setInterval(() => {
      if (callWindow?.closed) {
        setIsCallActive(false);
        clearInterval(checkClosed);
      }
    }, 1000);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={startVideoCall}
        disabled={isCallActive}
        className="flex items-center gap-2"
      >
        {isCallActive ? (
          <>
            <VideoOff className="h-4 w-4" />
            Call Active
          </>
        ) : (
          <>
            <Video className="h-4 w-4" />
            Video Call
          </>
        )}
      </Button>
    </>
  );
};
