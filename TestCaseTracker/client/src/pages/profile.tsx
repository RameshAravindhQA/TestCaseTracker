import React, { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { User } from "@/types";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useColorTheme } from "@/components/theme/theme-provider";
import { Loader2, Upload, Play, Pause, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { LottieFileDebug } from "@/components/lottie-file-debug";
import { LottieAvatar, LottieAvatarGrid } from "@/components/ui/lottie-avatar";
import { useMemo } from "react";

// Form schema for profile data
const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.string().optional(),
  theme: z.string().optional(),
  colorTheme: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Form schema for password change
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Please confirm your new password." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface LottieAnimation {
  id: string;
  name: string;
  path: string;
  preview?: any;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { colorTheme, setColorTheme } = useColorTheme(); // Move this up
  const [selectedLottie, setSelectedLottie] = useState<LottieAnimation | null>(null);
  const [lottieAnimations, setLottieAnimations] = useState<LottieAnimation[]>([
    { id: 'rocket', name: 'Rocket', path: '/lottie/rocket.json' },
    { id: 'businessman-rocket', name: 'Business Rocket', path: '/lottie/businessman-rocket.json' },
    { id: 'male-avatar', name: 'Male Avatar', path: '/lottie/male-avatar.json' },
    { id: 'female-avatar', name: 'Female Avatar', path: '/lottie/female-avatar.json' },
    { id: 'business-team', name: 'Business Team', path: '/lottie/business-team.json' },
    { id: 'office-team', name: 'Office Team', path: '/lottie/office-team.json' },
    { id: 'software-dev', name: 'Software Dev', path: '/lottie/software-dev.json' }
  ]);
  const [playingAnimations, setPlayingAnimations] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure user is available before proceeding
  const currentUser = user;

  // Early return if user is not available
  if (!currentUser) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading Profile...</h2>
            <p className="text-muted-foreground">Please wait while we load your profile information.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const loadAnimations = useCallback(async () => {
    try {
      console.log('🎬 Starting to load Lottie animations...');

      // Define animations to load with multiple path attempts
      const animationsToLoad = [
        { id: 'rocket', name: 'Rocket', paths: ['/lottie/rocket.json', '/TestCaseTracker/client/public/lottie/rocket.json'] },
        { id: 'businessman-rocket', name: 'Business Rocket', paths: ['/lottie/businessman-rocket.json', '/TestCaseTracker/client/public/lottie/businessman-rocket.json'] },
        { id: 'male-avatar', name: 'Male Avatar', paths: ['/lottie/male-avatar.json', '/TestCaseTracker/client/public/lottie/male-avatar.json'] },
        { id: 'female-avatar', name: 'Female Avatar', paths: ['/lottie/female-avatar.json', '/TestCaseTracker/client/public/lottie/female-avatar.json'] },
        { id: 'business-team', name: 'Business Team', paths: ['/lottie/business-team.json', '/TestCaseTracker/client/public/lottie/business-team.json'] },
        { id: 'office-team', name: 'Office Team', paths: ['/lottie/office-team.json', '/TestCaseTracker/client/public/lottie/office-team.json'] },
        { id: 'software-dev', name: 'Software Dev', paths: ['/lottie/software-dev.json', '/TestCaseTracker/client/public/lottie/software-dev.json'] }
      ];

      const loadedAnimations = await Promise.all(
        animationsToLoad.map(async (animation) => {
          try {
            console.log(`🎬 Loading animation: ${animation.name}`);

            let data = null;
            let workingPath = null;

            // Try each path until one works
            for (const path of animation.paths) {
              try {
                console.log(`🔄 Trying path: ${path}`);
                const response = await fetch(path);

                if (response.ok) {
                  const text = await response.text();

                  // Check if we got HTML instead of JSON (404 page)
                  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                    console.warn(`⚠️ Received HTML (likely 404) for ${path}`);
                    continue;
                  }

                  // Parse JSON
                  try {
                    data = JSON.parse(text);
                    workingPath = path;
                    console.log(`✅ Successfully loaded from: ${path}`);
                    break;
                  } catch (parseError) {
                    console.error(`❌ JSON parse error for ${path}:`, parseError);
                    continue;
                  }
                } else {
                  console.warn(`⚠️ HTTP ${response.status} for ${path}`);
                }
              } catch (fetchError) {
                console.error(`❌ Fetch error for ${path}:`, fetchError);
              }
            }

            // If we found valid data, validate it
            if (data && workingPath) {
              // Validate Lottie structure
              const hasVersion = data.v || data.version;
              const hasLayers = Array.isArray(data.layers) && data.layers.length > 0;
              const hasFrameRate = data.fr || data.frameRate;
              const hasWidth = data.w || data.width;
              const hasHeight = data.h || data.height;

              if (hasVersion && hasLayers && hasFrameRate) {
                // Ensure required Lottie properties
                const sanitizedData = {
                  ...data,
                  fr: data.fr || data.frameRate || 30,
                  w: data.w || data.width || 500,
                  h: data.h || data.height || 500,
                  ip: data.ip || 0,
                  op: data.op || data.frames || 60,
                  ddd: data.ddd || 0,
                  assets: data.assets || [],
                  layers: data.layers || []
                };

                console.log(`✅ Valid Lottie: ${animation.name} (v${data.v}, ${data.layers.length} layers, ${sanitizedData.fr}fps)`);
                return { 
                  ...animation, 
                  path: workingPath, 
                  preview: sanitizedData, 
                  isValid: true 
                };
              } else {
                console.warn(`⚠️ Invalid Lottie structure for ${animation.name}:`, {
                  hasVersion,
                  hasLayers,
                  hasFrameRate,
                  hasWidth,
                  hasHeight,
                  layersCount: data.layers?.length || 0
                });
              }
            }

            // Return failed animation
            return { 
              ...animation, 
              path: animation.paths[0], 
              preview: null, 
              isValid: false 
            };

          } catch (error) {
            console.error(`❌ Error loading ${animation.name} animation:`, error);
            return { 
              ...animation, 
              path: animation.paths[0], 
              preview: null, 
              isValid: false 
            };
          }
        })
      );

      // Filter and log results
      const workingAnimations = loadedAnimations.filter(anim => anim.preview !== null && anim.isValid);
      const failedAnimations = loadedAnimations.filter(anim => !anim.isValid);

      console.log(`📊 Animation loading results:`);
      console.log(`✅ Working: ${workingAnimations.length}/${animationsToLoad.length}`);
      console.log(`❌ Failed: ${failedAnimations.length}/${animationsToLoad.length}`);

      if (failedAnimations.length > 0) {
        console.log('❌ Failed animations:', failedAnimations.map(a => a.name));
      }

      setLottieAnimations(workingAnimations);

      // Set a default selected animation if user has one
      if (currentUser?.avatarData && workingAnimations.length > 0) {
        try {
          const userAnimationData = typeof currentUser.avatarData === 'string' 
            ? JSON.parse(currentUser.avatarData) 
            : currentUser.avatarData;

          const userAnimation = workingAnimations.find(anim => anim.id === userAnimationData?.id);
          if (userAnimation) {
            setSelectedLottie(userAnimation);
          }
        } catch (error) {
          console.error('❌ Error parsing user avatar data:', error);
        }
      }

      // Show user-friendly message about loading results
      if (workingAnimations.length === 0) {
        toast({
          title: "No Animations Available",
          description: "No valid Lottie animations could be loaded. Please check the files.",
          variant: "destructive",
        });
      } else if (failedAnimations.length > 0) {
        toast({
          title: "Partial Load",
          description: `Loaded ${workingAnimations.length} animations. ${failedAnimations.length} failed to load.`,
        });
      } else {
        toast({
          title: "Animations Loaded",
          description: `Successfully loaded ${workingAnimations.length} Lottie animations.`,
        });
      }

      // Auto-play all valid animations
      const validIds = workingAnimations.map(anim => anim.id);
      setPlayingAnimations(new Set(validIds));

    } catch (error) {
      console.error('❌ Error loading animations:', error);
      toast({
        title: "Animation Loading Error",
        description: "Failed to load Lottie animations. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }, [currentUser, toast]);

  // Fetch current user data
  const { data: fetchedCurrentUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user/current'],
    queryFn: async () => {
      // Try to get user data from either endpoint
      try {
        const response = await fetch('/api/user/current', { credentials: 'include' });
        if (response.ok) {
          return response.json();
        }
      } catch (err) {
        console.error('Error fetching from /api/user/current:', err);
      }

      // Fall back to auth endpoint if needed
      const authResponse = await fetch('/api/auth/user', { credentials: 'include' });
      if (!authResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      return authResponse.json();
    },
    enabled: !!currentUser // Only fetch if currentUser is available
  });

  useEffect(() => {
    if (fetchedCurrentUser) {
      // Update form values when user data loads
      profileForm.reset({
        firstName: fetchedCurrentUser.firstName || "",
        lastName: fetchedCurrentUser.lastName || "",
        email: fetchedCurrentUser.email || "",
        role: fetchedCurrentUser.role || "",
        theme: fetchedCurrentUser.theme || "default",
        colorTheme: fetchedCurrentUser.colorTheme || colorTheme || "blue",
      });
    }
  }, [fetchedCurrentUser, colorTheme]);

  useEffect(() => {
    loadAnimations();
  }, [loadAnimations]);

  // Color theme is already declared above

  // Profile form setup - initialize with empty defaults first
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      theme: "default",
      colorTheme: "blue",
    },
  });

  // Update profile form when user data is loaded
  const { isSubmitting: isProfileSubmitting } = profileForm.formState;

  // Password form setup
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest(
        "PATCH",
        `/api/user/${currentUser?.id}`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/current'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      try {
        const res = await apiRequest(
          "POST",
          '/api/user/change-password',
          {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }
        );
        // Handle response that may not be valid JSON
        if (!res.ok) {
          const text = await res.text();
          try {
            return JSON.parse(text); // Try to parse as JSON
          } catch (e) {
            // If not valid JSON, return an object with the text
            return { message: text || 'Password update failed' };
          }
        }
        return res.json();
      } catch (error) {
        console.error('Password update error:', error);
        throw new Error('Failed to update password. Please try again.');
      }
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to change password: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateLottieAvatarMutation = useMutation({
    mutationFn: async (lottieData: LottieAnimation) => {
      console.log('🔄 Updating avatar with Lottie data:', lottieData);

      try {
        // Create a stable data object without blob URLs
        const stableAvatarData = {
          id: lottieData.id,
          name: lottieData.name,
          path: lottieData.path,
          preview: lottieData.preview
        };

        // Use a stable identifier that doesn't conflict with image URLs
        const profilePictureValue = `lottie-avatar-${lottieData.id}`;

        // First try the users endpoint
        let response = await fetch('/api/users/update-avatar', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            profilePicture: profilePictureValue,
            avatarType: 'lottie',
            avatarData: stableAvatarData
          })
        });

        // If users endpoint fails, try the user endpoint
        if (!response.ok) {
          console.log('🔄 Trying alternative endpoint...');
          response = await fetch(`/api/user/${currentUser?.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              profilePicture: profilePictureValue,
              avatarType: 'lottie',
              avatarData: JSON.stringify(stableAvatarData)
            })
          });
        }

        if (!response.ok) {
          let errorMessage = `Update failed with status ${response.status}`;

          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // If JSON parsing fails, try to get text response
            try {
              const text = await response.text();
              if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                errorMessage = "Server returned an error page. Please check if you're logged in.";
              } else {
                errorMessage = text || errorMessage;
              }
            } catch (textError) {
              console.error('Failed to parse error response:', textError);
            }
          }

          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('✅ Avatar update successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Avatar update request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Avatar Updated",
        description: `Your avatar has been updated to "${selectedLottie?.name}" successfully!`,
      });

      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      // Update the profile picture URL to show the new avatar
      if (data.profilePicture || data.user?.profilePicture) {
        const newUrl = data.profilePicture || data.user?.profilePicture;
        setProfilePictureUrl(`${newUrl}?t=${Date.now()}`);
        refreshAvatar();
      }
    },
    onError: (error: Error) => {
      console.error('❌ Avatar update failed:', error);
      toast({
        title: "Avatar Update Failed",
        description: error.message || "Failed to update avatar. Please try again.",
        variant: "destructive",
      });

      // Reset selected animation on error
      setSelectedLottie(null);
    },
  });

  // Profile picture upload mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log("Starting profile picture upload");
      console.log("FormData contents:", Array.from(formData.entries()));
      
      try {
        // Use fetch directly to ensure proper FormData handling
        const response = await fetch('/api/user/upload-profile-picture', {
          method: 'POST',
          body: formData, // Don't set Content-Type header, let browser set it
          credentials: 'include'
        });

        console.log("Upload response status:", response.status);
        console.log("Upload response headers:", response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload error response:", errorText);
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();
        console.log("Upload response:", jsonData);
        return jsonData;
      } catch (error) {
        console.error("Profile picture upload request error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Profile picture updated successfully:", data);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
      // Force reload the current user data
      queryClient.invalidateQueries({ queryKey: ['/api/user/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

      // Update the profile picture URL immediately with the new path
      if (data.profilePicture) {
        setProfilePictureUrl(`${data.profilePicture}?t=${Date.now()}`);
      }

      // Force refresh the avatar
      refreshAvatar();

      // Add a slight delay before stopping the loading state to ensure the data has refreshed
      setTimeout(() => setUploading(false), 1000);
    },
    onError: (error: any) => {
      console.error("Profile picture upload error:", error);

      // Try to extract a more detailed error message if available
      let errorMsg = "Failed to upload profile picture. Please try again.";
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error && 'message' in error) {
        errorMsg = String(error.message);
      }

      toast({
        title: "Upload Error",
        description: errorMsg,
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  // Form submission handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  const handleLottieSelect = (animation: LottieAnimation) => {
    console.log('🎭 Selecting Lottie animation:', animation);

    // Prevent multiple rapid selections
    if (updateLottieAvatarMutation.isPending) {
      return;
    }

    // Set the selected animation immediately for UI feedback
    setSelectedLottie(prev => {
      console.log('Previous selection:', prev?.id, 'New selection:', animation.id);
      return animation;
    });

    // Show loading toast
    toast({
      title: "Updating Avatar",
      description: `Setting "${animation.name}" as your avatar...`,
    });

    // Update the avatar
    updateLottieAvatarMutation.mutate(animation);
  };

  const toggleAnimation = (animationId: string) => {
    setPlayingAnimations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(animationId)) {
        newSet.delete(animationId);
      } else {
        newSet.add(animationId);
      }
      return newSet;
    });
  };

  // Handle profile picture upload
  const handleProfilePictureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type, file.size);

    // Check file type
    if (file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      handleLottieFileUpload(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload an image (JPEG, PNG, GIF, WebP) or Lottie JSON file.",
        variant: "destructive",
      });
    }

    // Clear the input value to allow re-upload of the same file
    event.target.value = '';
  };

  const handleImageUpload = async (file: File) => {
    console.log("🖼️ Starting image upload:", file.name, file.size);

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be under 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file, file.name);

      console.log("📤 Uploading image FormData:", formData);
      console.log("📤 FormData entries:", Array.from(formData.entries()));
      console.log("📤 File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Show uploading toast
      toast({
        title: "Uploading...",
        description: "Your profile picture is being uploaded.",
      });

      uploadProfilePictureMutation.mutate(formData);
    } catch (error) {
      console.error("❌ Image upload error:", error);
      setUploading(false);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create a key for the avatar to force re-render when profile picture changes
  const [avatarKey, setAvatarKey] = useState(() => Date.now());

  // Track the profile picture URL separately to avoid disappearing issues
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  // Update profile picture URL when user data changes
  useEffect(() => {
    if (fetchedCurrentUser?.profilePicture) {
      setProfilePictureUrl(`${fetchedCurrentUser.profilePicture}?t=${Date.now()}`);
    }
  }, [fetchedCurrentUser]);

  // Refresh avatar key when the manual refresh is needed (like after upload)
  const refreshAvatar = () => {
    const newKey = Date.now();
    setAvatarKey(newKey);

    // Also update the URL with the new timestamp
    if (fetchedCurrentUser?.profilePicture) {
      setProfilePictureUrl(`${fetchedCurrentUser.profilePicture}?t=${newKey}`);
    }
  };

  const handleLottieFileUpload = async (file: File) => {
    console.log("🎭 Starting Lottie file upload:", file.name, file.size);

    // Validate file size
    if (file.size > 10 * 1024 * 1024) { // Reduced to 10MB for better performance
      toast({
        title: "File too large",
        description: "Lottie file must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file containing Lottie animation data",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      console.log("📖 Reading Lottie file...");
      const text = await file.text();

      // Parse JSON with better error handling
      let jsonData;
      try {
        jsonData = JSON.parse(text);
        console.log("✅ JSON parsed successfully");
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }

      // Comprehensive Lottie validation
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error("Invalid Lottie file - not a valid JSON object");
      }

      if (!jsonData.v && !jsonData.version) {
        throw new Error("Invalid Lottie file - missing version information");
      }

      if (!jsonData.layers || !Array.isArray(jsonData.layers)) {
        throw new Error("Invalid Lottie file - missing or invalid layers");
      }

      if (jsonData.layers.length === 0) {
        throw new Error("Invalid Lottie file - no animation layers found");
      }

      // Ensure required properties for playback
      const sanitizedData = {
        ...jsonData,
        fr: jsonData.fr || jsonData.frameRate || 30,
        w: jsonData.w || jsonData.width || 500,
        h: jsonData.h || jsonData.height || 500,
        ip: jsonData.ip || 0,
        op: jsonData.op || jsonData.frames || 60,
        ddd: jsonData.ddd || 0,
        assets: jsonData.assets || []
      };

      console.log("✅ Lottie validation passed:", {
        version: sanitizedData.v,
        layers: sanitizedData.layers.length,
        frameRate: sanitizedData.fr,
        width: sanitizedData.w,
        height: sanitizedData.h
      });

      // Create animation object
      const animationId = `custom-${Date.now()}`;
      const fileName = file.name.replace(/\.json$/i, '');
      const newAnimation: LottieAnimation = {
        id: animationId,
        name: fileName,
        path: URL.createObjectURL(file),
        preview: sanitizedData
      };

      console.log('🎭 Created Lottie animation:', newAnimation);

      // Add to animations list immediately for UI feedback
      setLottieAnimations(prev => {
        const existingIndex = prev.findIndex(anim => anim.name === fileName);
        if (existingIndex >= 0) {
          const newAnimations = [...prev];
          newAnimations[existingIndex] = newAnimation;
          return newAnimations;
        } else {
          return [...prev, newAnimation];
        }
      });

      // Auto-select the newly uploaded animation
      setSelectedLottie(newAnimation);

      toast({
        title: "Lottie Upload Success",
        description: `Animation "${fileName}" loaded successfully! Click to set as avatar.`,
      });

      // Try to save to backend using the bug attachment endpoint (which now supports JSON)
      try {
        console.log("💾 Saving to backend...");
        const formData = new FormData();
        formData.append('file', file); // Use 'file' field name for bug attachment endpoint
        
        const response = await fetch("/api/uploads/bug-attachment", {
          method: "POST",
          body: formData,
          credentials: 'include'
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            console.log('✅ Backend upload successful:', result);

            // Update the animation with server path if provided
            if (result.fileUrl) {
              setLottieAnimations(prev => prev.map(anim => 
                anim.id === newAnimation.id ? { ...anim, path: result.fileUrl } : anim
              ));
            }
          } else {
            const text = await response.text();
            console.warn('⚠️ Backend returned non-JSON response:', text.substring(0, 200));
            
            // Check if it's an HTML error page
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
              console.warn('⚠️ Received HTML error page from server');
              toast({
                title: "Upload Warning",
                description: "Server returned an error page. Animation saved locally only.",
                variant: "destructive",
              });
            } else {
              console.warn('⚠️ Backend upload failed, keeping local version');
            }
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error(`❌ Backend upload failed with status ${response.status}:`, errorData);
          
          toast({
            title: "Upload Failed",
            description: `Server error (${response.status}): ${errorData.message}. Animation saved locally only.`,
            variant: "destructive",
          });
        }
      } catch (uploadError) {
        console.error("❌ Backend upload failed:", uploadError);
        toast({
          title: "Upload Error",
          description: "Network error. Animation saved locally only.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("❌ Lottie upload error:", error);
      toast({
        title: "Lottie Upload Error",
        description: error.message || "Failed to process Lottie file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

    // Compute avatar source with proper Lottie handling
  const avatarSrc = useMemo(() => {
    if (!fetchedCurrentUser) return undefined;

    // Handle Lottie animations - don't use profilePicture URL for Lottie
    if (fetchedCurrentUser.avatarType === 'lottie' && fetchedCurrentUser.avatarData) {
      // Return null for Lottie animations as they should be rendered by LottieAvatar component
      return null;
    }

    // Handle regular profile pictures
    if (fetchedCurrentUser.profilePicture && !fetchedCurrentUser.profilePicture.startsWith('lottie:')) {
      // Add cache busting timestamp
      const separator = fetchedCurrentUser.profilePicture.includes('?') ? '&' : '?';
      return `${fetchedCurrentUser.profilePicture}${separator}t=${avatarKey}&v=${Date.now()}`;
    }

    return undefined;
  }, [fetchedCurrentUser, avatarKey]);

  // Get Lottie data for avatar display
  const avatarLottieData = useMemo(() => {
    if (!fetchedCurrentUser || fetchedCurrentUser.avatarType !== 'lottie' || !fetchedCurrentUser.avatarData) {
      return null;
    }

    try {
      const avatarData = typeof fetchedCurrentUser.avatarData === 'string' 
        ? JSON.parse(fetchedCurrentUser.avatarData) 
        : fetchedCurrentUser.avatarData;
      
      return avatarData?.preview || null;
    } catch (error) {
      console.error('❌ Error parsing avatar Lottie data:', error);
      return null;
    }
  }, [fetchedCurrentUser]);

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile picture card - optimized width */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Profile Picture</CardTitle>
              <CardDescription className="text-sm">Update your avatar</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative cursor-pointer"
                onClick={handleProfilePictureClick}
              >
                <div className="h-24 w-24 border-2 border-primary/20 rounded-full overflow-hidden bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
                  {avatarLottieData ? (
                    <LottieAvatar
                      animationData={avatarLottieData}
                      width={88}
                      height={88}
                      autoplay={true}
                      loop={true}
                      name={fetchedCurrentUser?.firstName || 'User'}
                    />
                  ) : avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      key={avatarKey}
                      onError={(e) => {
                        console.error("Avatar image failed to load:", e);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-xl text-white font-semibold">
                      {(fetchedCurrentUser?.firstName?.charAt(0)?.toUpperCase() || '') + (fetchedCurrentUser?.lastName?.charAt(0)?.toUpperCase() || '') || "U"}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                {uploading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
                  >
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </motion.div>
                )}
              </motion.div>

              <Button 
                variant="outline"
                size="sm"
                onClick={handleProfilePictureClick}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Picture
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                JPEG, PNG, GIF, WebP, Lottie JSON<br />
                Max: 2MB (images), 20MB (Lottie)
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/json,.json"
                className="hidden"
                key={avatarKey} // Force re-render to clear previous selection
              />
            </CardContent>
          </Card>

          {/* Profile settings tabs - optimized width */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your profile information and password</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="avatar">Avatar Animation</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="First name" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Last name" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your email" 
                                type="email" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your role" 
                                {...field} 
                                disabled 
                              />
                            </FormControl>
                            <FormDescription>
                              Your role determines your access level and cannot be changed here.
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Light/Dark Mode Preference</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            ><FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="default">System Default</SelectItem>
                                <SelectItem value="dark">Dark Mode</SelectItem>
                                <SelectItem value="light">Light Mode</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose your preferred light/dark mode.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="colorTheme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color Theme</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setColorTheme(value);
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a color theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="blue">Blue</SelectItem>
                                <SelectItem value="purple">Purple</SelectItem>
                                <SelectItem value="teal">Teal</SelectItem>
                                <SelectItem value="green">Green</SelectItem>
                                <SelectItem value="red">Red</SelectItem>
                                <SelectItem value="orange">Orange</SelectItem>
                                <SelectItem value="pink">Pink</SelectItem>
                                <SelectItem value="indigo">Indigo</SelectItem>
                                <SelectItem value="amber">Amber</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose your preferred color theme. Changes apply immediately.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isProfileSubmitting}>
                          {isProfileSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                {/* Password Tab */}
                <TabsContent value="password">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 pt-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <PasswordInput 
                                placeholder="Enter your current password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="my-4" />

                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <PasswordInput 
                                placeholder="Enter your new password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 6 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <PasswordInput 
                                placeholder="Confirm your new password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-2">
                        <Button 
                          type="submit" 
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Change Password"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                 {/* Lottie Avatar Tab */}
                <TabsContent value="avatar">
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Lottie Avatar</h3>
                        <p className="text-sm text-muted-foreground">Upload and select Lottie animations</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Lottie
                      </Button>
                    </div>

                    {/* Current Selection */}
                    {selectedLottie && (
                      <div className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 border rounded overflow-hidden bg-white flex items-center justify-center">
                            <LottieAvatar
                              animationData={selectedLottie.preview}
                              width={40}
                              height={40}
                              autoplay={true}
                              loop={true}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{selectedLottie.name}</p>
                            <p className="text-xs text-muted-foreground">Current avatar animation</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Animation Grid */}
                    {uploading ? (
                      <div className="text-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading animations...</p>
                      </div>
                    ) : lottieAnimations.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {lottieAnimations.map((animation) => (
                          <motion.div
                            key={animation.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                              selectedLottie?.id === animation.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => handleLottieSelect(animation)}
                          >
                            <div className="aspect-square bg-white rounded overflow-hidden flex items-center justify-center">
                              <LottieAvatar
                                animationData={animation.preview}
                                width={60}
                                height={60}
                                autoplay={playingAnimations.has(animation.id)}
                                loop={true}
                              />
                            </div>
                            <p className="text-xs text-center mt-1 truncate" title={animation.name}>
                              {animation.name}
                            </p>
                            {selectedLottie?.id === animation.id && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-3">No Lottie animations available</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          Upload First Animation
                        </Button>
                      </div>
                    )}

                    {/* Upload Info */}
                    <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
                      <p className="font-medium mb-1">Upload Requirements:</p>
                      <p>• Valid Lottie JSON files only • Max size: 20MB • Click any animation to set as avatar</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}