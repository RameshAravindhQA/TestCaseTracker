
import React, { useState, useEffect, useRef } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Upload, User, RotateCcw } from 'lucide-react';
import { useToast } from './ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ProfilePictureProps {
  userId?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  showName?: boolean;
  userName?: string;
  className?: string;
}

interface LottieSettings {
  enabled: boolean;
  animationUrl: string;
  defaultAnimations: {
    login: string;
    welcome: string;
    profile: string;
    success: string;
    loading: string;
  };
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  userId,
  size = 'md',
  editable = false,
  showName = false,
  userName = 'User',
  className = ''
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lottieInputRef = useRef<HTMLInputElement>(null);
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [lottieSettings, setLottieSettings] = useState<LottieSettings>({
    enabled: true,
    animationUrl: '/lottie/Profile Avatar of Young Boy_1752294847420.json',
    defaultAnimations: {
      login: '/lottie/Business team_1752294842244.json',
      welcome: '/lottie/Businessman flies up with rocket_1752294839035.json',
      profile: '/lottie/Profile Avatar of Young Boy_1752294847420.json',
      success: '/lottie/Female 05_1752294849174.json',
      loading: '/lottie/Rocket lottie Animation_1752294834959.json'
    }
  });
  const [uploadType, setUploadType] = useState<'image' | 'lottie'>('image');

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // Load settings from localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem(`profileImage_${userId}`);
    const savedLottieSettings = localStorage.getItem('lottieSettings');
    
    if (savedImage) {
      setProfileImage(savedImage);
    }
    
    if (savedLottieSettings) {
      try {
        setLottieSettings(JSON.parse(savedLottieSettings));
      } catch (error) {
        console.warn('Failed to parse lottie settings:', error);
      }
    }
  }, [userId]);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile-picture', file);
      formData.append('userId', userId?.toString() || '0');

      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { filePath } = await response.json();
      setProfileImage(filePath);
      localStorage.setItem(`profileImage_${userId}`, filePath);
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setShowUploadDialog(false);
    }
  };

  const handleLottieUpload = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON file containing Lottie animation data.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('lottie-animation', file);
      formData.append('category', 'profile');

      const response = await fetch('/api/upload/lottie', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { filePath } = await response.json();
      const newSettings = {
        ...lottieSettings,
        animationUrl: filePath,
        enabled: true
      };
      
      setLottieSettings(newSettings);
      localStorage.setItem('lottieSettings', JSON.stringify(newSettings));
      
      toast({
        title: "Lottie animation updated",
        description: "Your profile animation has been updated successfully.",
      });
    } catch (error) {
      console.error('Lottie upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload Lottie animation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setShowUploadDialog(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (uploadType === 'image') {
      handleImageUpload(file);
    } else {
      handleLottieUpload(file);
    }
  };

  const resetToDefault = () => {
    setProfileImage(null);
    localStorage.removeItem(`profileImage_${userId}`);
    
    const defaultSettings = {
      enabled: true,
      animationUrl: '/lottie/Profile Avatar of Young Boy_1752294847420.json',
      defaultAnimations: {
        login: '/lottie/Business team_1752294842244.json',
        welcome: '/lottie/Businessman flies up with rocket_1752294839035.json',
        profile: '/lottie/Profile Avatar of Young Boy_1752294847420.json',
        success: '/lottie/Female 05_1752294849174.json',
        loading: '/lottie/Rocket lottie Animation_1752294834959.json'
      }
    };
    
    setLottieSettings(defaultSettings);
    localStorage.setItem('lottieSettings', JSON.stringify(defaultSettings));
    
    toast({
      title: "Reset to default",
      description: "Profile picture reset to default animation.",
    });
  };

  const renderAvatar = () => {
    if (lottieSettings.enabled && !profileImage) {
      return (
        <div className={`${sizeClasses[size]} ${className} relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center`}>
          <Player
            autoplay
            loop
            src={lottieSettings.animationUrl}
            style={{ width: '100%', height: '100%' }}
            onError={(error) => {
              console.error('Error loading Lottie animation:', error);
              // Fallback to regular avatar on error
            }}
          />
        </div>
      );
    }

    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarImage src={profileImage || undefined} alt={userName} />
        <AvatarFallback>
          <User className="w-1/2 h-1/2" />
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {renderAvatar()}
        
        {editable && (
          <Button
            size="sm"
            variant="outline"
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full p-0"
            onClick={() => setShowUploadDialog(true)}
          >
            <Upload className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {showName && (
        <span className="font-medium text-sm">{userName}</span>
      )}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          
          <Tabs value={uploadType} onValueChange={(value) => setUploadType(value as 'image' | 'lottie')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="lottie">Animation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="image" className="space-y-4">
              <div>
                <Label htmlFor="image-upload">Upload Image</Label>
                <Input
                  id="image-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="lottie" className="space-y-4">
              <div>
                <Label htmlFor="lottie-upload">Upload Lottie Animation (JSON)</Label>
                <Input
                  id="lottie-upload"
                  ref={lottieInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>• Upload a Lottie animation JSON file</p>
                <p>• Animations will loop automatically</p>
                <p>• Recommended size: 512x512 pixels</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={resetToDefault}
              disabled={isUploading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePicture;
