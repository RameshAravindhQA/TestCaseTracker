import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Loader2, Upload, Play, Pause, Camera, Edit3, Save, X, Shield, Clock, Settings, Mail, User as UserIcon, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { LottieFileDebug } from "@/components/lottie-file-debug";
import { LottieAvatar, LottieAvatarGrid } from "@/components/ui/lottie-avatar";

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

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture?: string;
  avatarType?: string;
  avatarData?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { colorTheme, setColorTheme } = useColorTheme();
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
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });

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

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      console.log('Fetching profile data...');
      const response = await apiRequest("GET", "/api/auth/user");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      console.log('Profile data received:', data);

      // Update form data with received profile data
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
      });

      return data;
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (profile) {
      // Update form values when user data loads
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    loadAnimations();
  }, [loadAnimations]);

  // Profile form setup - initialize with user data
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: currentUser?.firstName || "",
      lastName: currentUser?.lastName || "",
      email: currentUser?.email || "",
      role: currentUser?.role || "",
      theme: "default",
      colorTheme: "blue",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName || "",
        email: currentUser.email,
        role: currentUser.role,
        theme: "default",
        colorTheme: colorTheme,
      });
    }
  }, [currentUser, profileForm, colorTheme]);

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
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditing(false);
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
        if (!res.ok) {
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch (e) {
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
        const stableAvatarData = {
          id: lottieData.id,
          name: lottieData.name,
          path: lottieData.path,
          preview: lottieData.preview
        };

        const profilePictureValue = `lottie-avatar-${lottieData.id}`;

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

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
      setSelectedLottie(null);
    },
  });

  // Profile picture upload mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log("Starting profile picture upload");
      console.log("FormData contents:", Array.from(formData.entries()));

      try {
        const response = await fetch('/api/user/upload-profile-picture', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        console.log("Upload response status:", response.status);

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

      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

      if (data.profilePicture) {
        setProfilePictureUrl(`${data.profilePicture}?t=${Date.now()}`);
      }

      refreshAvatar();
      setTimeout(() => setUploading(false), 1000);
    },
    onError: (error: any) => {
      console.error("Profile picture upload error:", error);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: currentUser?.email || "",
    });
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  const handleLottieSelect = (animation: LottieAnimation) => {
    console.log('🎭 Selecting Lottie animation:', animation);

    if (updateLottieAvatarMutation.isPending) {
      return;
    }

    setSelectedLottie(prev => {
      console.log('Previous selection:', prev?.id, 'New selection:', animation.id);
      return animation;
    });

    toast({
      title: "Updating Avatar",
      description: `Setting "${animation.name}" as your avatar...`,
    });

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
    console.log('Profile picture click triggered');
    if (fileInputRef.current) {
      console.log('File input reference exists, clicking...');
      fileInputRef.current.click();
    } else {
      console.error('File input reference not found');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type, file.size);

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File must be under 20MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      handleLottieFileUpload(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload an image (JPEG, PNG, GIF, WebP) or Lottie JSON file (max 20MB).",
        variant: "destructive",
      });
    }

    event.target.value = '';
  };

  const handleImageUpload = async (file: File) => {
    console.log("🖼️ Starting image upload:", file.name, file.size);

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file, file.name);

      console.log("📤 Uploading image FormData:", formData);

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
    if (profile?.profilePicture) {
      setProfilePictureUrl(`${profile.profilePicture}?t=${Date.now()}`);
    }
  }, [profile]);

  // Refresh avatar key when the manual refresh is needed (like after upload)
  const refreshAvatar = () => {
    const newKey = Date.now();
    setAvatarKey(newKey);

    if (profile?.profilePicture) {
      setProfilePictureUrl(`${profile.profilePicture}?t=${newKey}`);
    }
  };

  const handleLottieFileUpload = async (file: File) => {
    console.log("🎭 Starting Lottie file upload:", file.name, file.size);

    setUploading(true);

    try {
      console.log("📖 Reading Lottie file...");
      const text = await file.text();

      let jsonData;
      try {
        jsonData = JSON.parse(text);
        console.log("✅ JSON parsed successfully");
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }

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

      const animationId = `custom-${Date.now()}`;
      const fileName = file.name.replace(/\.json$/i, '');
      const newAnimation: LottieAnimation = {
        id: animationId,
        name: fileName,
        path: URL.createObjectURL(file),
        preview: sanitizedData
      };

      console.log('🎭 Created Lottie animation:', newAnimation);

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

      setSelectedLottie(newAnimation);

      toast({
        title: "Lottie Upload Success",
        description: `Animation "${fileName}" loaded successfully! Click to set as avatar.`,
      });

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
    if (!profile) return undefined;

    if (profile.avatarType === 'lottie' && profile.avatarData) {
      return null;
    }

    if (profile.profilePicture && !profile.profilePicture.startsWith('lottie:')) {
      const separator = profile.profilePicture.includes('?') ? '&' : '?';
      return `${profile.profilePicture}${separator}t=${avatarKey}&v=${Date.now()}`;
    }

    return undefined;
  }, [profile, avatarKey]);

  // Get Lottie data for avatar display
  const avatarLottieData = useMemo(() => {
    if (!profile || profile.avatarType !== 'lottie' || !profile.avatarData) {
      return null;
    }

    try {
      const avatarData = typeof profile.avatarData === 'string' 
        ? JSON.parse(profile.avatarData) 
        : profile.avatarData;

      return avatarData?.preview || null;
    } catch (error) {
      console.error('❌ Error parsing avatar Lottie data:', error);
      return null;
    }
  }, [profile]);

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tester': return 'bg-green-100 text-green-800 border-green-200';
      case 'developer': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  const [users, setUsers] = useState<any[]>([]);

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 min-h-screen overflow-hidden overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-600">
        {/* Header */}
        <motion.div 
          className="mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account information and preferences</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="avatar">Avatar</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Picture & Basic Info Card */}
                <motion.div variants={cardVariants}>
                  <Card className="lg:col-span-1">
                    <CardHeader className="text-center">
                      <div className="relative mx-auto">
                        {/* Profile Picture */}
                        <div 
                          className="relative w-32 h-32 mx-auto mb-4 cursor-pointer group"
                          onClick={handleProfilePictureClick}
                        >
                          <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                            {avatarLottieData ? (
                              <LottieAvatar
                                animationData={avatarLottieData}
                                size="lg"
                                className="w-full h-full"
                              />
                            ) : (
                              <Avatar className="w-full h-full">
                                <AvatarImage 
                                  src={avatarSrc} 
                                  alt={`${currentUser.firstName} ${currentUser.lastName || ''}`}
                                  className="object-cover"
                                />
                                <AvatarFallback className="text-2xl font-bold bg-blue-500 text-white">
                                  {currentUser.firstName?.[0]}{currentUser.lastName?.[0] || ''}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>

                          {/* Upload Overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Camera className="h-8 w-8 text-white" />
                          </div>

                          {uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-75 rounded-full flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.json"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      <CardTitle className="text-xl">
                        {currentUser.firstName} {currentUser.lastName || ''}
                      </CardTitle>
                      <CardDescription className="flex items-center justify-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(currentUser.role)}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {currentUser.role}
                        </span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4 mr-2" />
                          {currentUser.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          Joined {new Date(currentUser.createdAt).toLocaleDateString()}
                        </div>
                        {currentUser.lastLoginAt && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-2" />
                            Last login {new Date(currentUser.lastLoginAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Personal Information Card */}
                <motion.div variants={cardVariants}>
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                disabled={!isEditing}
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                disabled={!isEditing}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={currentUser.email}
                              disabled
                              className="bg-gray-50 dark:bg-gray-800"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                          </div>
                        </div>

                          <div className="flex justify-end">
                            {isEditing ? (
                              <div className="space-x-2">
                                <Button variant="ghost" onClick={() => {
                                  setIsEditing(false);
                                  setFormData({
                                    firstName: profile?.firstName || "",
                                    lastName: profile?.lastName || "",
                                  });
                                }}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={updateProfileMutation.isPending}>
                                  {updateProfileMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    "Save Changes"
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <Button onClick={() => setIsEditing(true)}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit Profile
                              </Button>
                            )}
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <motion.div variants={cardVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password for enhanced security</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <PasswordInput placeholder="Enter current password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <PasswordInput placeholder="Enter new password" {...field} />
                              </FormControl>
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
                                <PasswordInput placeholder="Confirm new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={updatePasswordMutation.isPending}>
                          {updatePasswordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Change Password"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Avatar Tab */}
            <TabsContent value="avatar" className="space-y-6">
              <motion.div variants={cardVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>Choose your Avatar</CardTitle>
                    <CardDescription>Select a Lottie animation or upload an image to represent yourself.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {lottieAnimations.map((animation) => (
                        <div key={animation.id} className="relative">
                          <LottieAvatarGrid
                            animationData={animation.preview}
                            isPlaying={playingAnimations.has(animation.id)}
                            isPaused={!playingAnimations.has(animation.id)}
                            onClick={() => handleLottieSelect(animation)}
                            isSelected={selectedLottie?.id === animation.id}
                            onMouseEnter={() => toggleAnimation(animation.id)}
                            onMouseLeave={() => toggleAnimation(animation.id)}
                            style={{ cursor: 'pointer' }}
                            animationId={animation.id}
                            users={users || []}
                          />
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Want to upload your own Lottie animation or image?
                      </p>
                      <Button variant="outline" onClick={handleProfilePictureClick}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
}