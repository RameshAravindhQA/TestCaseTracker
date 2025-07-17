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
import Lottie from "lottie-react";
import { useAuth } from "@/hooks/use-auth";
import { LottieFileDebug } from "@/components/lottie-file-debug";
import LottieFromPublic from "@/components/ui/lottie-from-public";

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
  const [lottieAnimations] = useState<LottieAnimation[]>([
    { id: 'rocket', name: 'Rocket', path: '/lottie/rocket.json' },
    { id: 'businessman-rocket', name: 'Business Rocket', path: '/lottie/businessman-rocket.json' },
    { id: 'male-avatar', name: 'Male Avatar', path: '/lottie/male-avatar.json' },
    { id: 'female-avatar', name: 'Female Avatar', path: '/lottie/female-avatar.json' },
    { id: 'business-team', name: 'Business Team', path: '/lottie/business-team.json' },
    { id: 'office-team', name: 'Office Team', path: '/lottie/office-team.json' },
    { id: 'software-dev', name: 'Software Dev', path: '/lottie/software-dev.json' }
  ]);
  const [loadedAnimations, setLoadedAnimations] = useState<Set<string>>(new Set());
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

  const handleAnimationLoad = useCallback((animationId: string, data: any) => {
    console.log(`✅ Animation loaded: ${animationId}`);
    setLoadedAnimations(prev => new Set([...prev, animationId]));
  }, []);

  const handleAnimationError = useCallback((animationId: string, error: string) => {
    console.error(`❌ Animation failed to load: ${animationId}`, error);
  }, []);

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

  // Set default selected animation if user has one
  useEffect(() => {
    if (currentUser?.avatarData && lottieAnimations.length > 0) {
      try {
        const userAnimationData = typeof currentUser.avatarData === 'string' 
          ? JSON.parse(currentUser.avatarData) 
          : currentUser.avatarData;

        const userAnimation = lottieAnimations.find(anim => anim.id === userAnimationData?.id);
        if (userAnimation) {
          setSelectedLottie(userAnimation);
        }
      } catch (error) {
        console.error('❌ Error parsing user avatar data:', error);
      }
    }
  }, [currentUser, lottieAnimations]);

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
        const response = await fetch('/api/users/update-avatar', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            profilePicture: lottieData.path,
            avatarType: 'lottie',
            avatarData: lottieData
          })
        });

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
      if (data.profilePicture) {
        setProfilePictureUrl(`${data.profilePicture}?t=${Date.now()}`);
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
      try {
        const res = await apiRequest(
          "POST",
          `/api/user/upload-profile-picture`,
          formData,
          { isFormData: true }
        );
        const jsonData = await res.json();
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

    // Set the selected animation immediately for UI feedback
    setSelectedLottie(animation);

    // Show loading toast
    toast({
      title: "Updating Avatar",
      description: `Setting "${animation.name}" as your avatar...`,
    });

    // Update the avatar
    updateLottieAvatarMutation.mutate(animation);
  };

  

  // Handle profile picture upload
  const handleProfilePictureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's a Lottie file
      const isLottieFile = file.type === 'application/json' || file.name.endsWith('.json');

      // Handle Lottie file upload
      if (isLottieFile) {
        handleLottieFileUpload(file);
        return;
      }

      // Check file size (limit to 2MB for images, 20MB for lottie)
      const maxSize = isLottieFile ? 20 * 1024 * 1024 : 2 * 1024 * 1024;
      const maxSizeText = isLottieFile ? '20MB' : '2MB';

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `Please select a file under ${maxSizeText}.`,
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/') && !isLottieFile) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file or Lottie JSON file.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      try {
        // Create a new FormData instance
        const formData = new FormData();

        // Append the file with the correct field name
        formData.append('profilePicture', file);

        // Log what we're uploading
        console.log("Uploading file:", file.name, file.type, file.size);

        // Reset the file input to allow selecting the same file again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Mutate with the form data
        uploadProfilePictureMutation.mutate(formData);
      } catch (error) {
        console.error("Error preparing file upload:", error);
        toast({
          title: "Upload Error",
          description: "Failed to prepare the file for upload.",
          variant: "destructive",
        });
        setUploading(false);
      }
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
    // Validate file size
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast({
        title: "File too large",
        description: "Lottie file must be under 20MB",
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
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const jsonContent = e.target?.result as string;

          // Parse JSON with better error handling
          let jsonData;
          try {
            jsonData = JSON.parse(jsonContent);
          } catch (parseError) {
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

          // Create animation object
          const animationId = `custom-${Date.now()}`;
          const fileName = file.name.replace(/\.json$/i, '');
          const newAnimation: LottieAnimation = {
            id: animationId,
            name: fileName,
            path: URL.createObjectURL(file),
            preview: jsonData
          };

          console.log('📁 Created Lottie animation:', newAnimation);

          // Add to animations list immediately for UI feedback
          setLottieAnimations(prev => {
            // Check if an animation with the same name already exists
            const existingIndex = prev.findIndex(anim => anim.name === fileName);
            if (existingIndex >= 0) {
              // Replace existing animation
              const newAnimations = [...prev];
              newAnimations[existingIndex] = newAnimation;
              return newAnimations;
            } else {
              // Add new animation
              return [...prev, newAnimation];
            }
          });

          // Auto-select the newly uploaded animation
          setSelectedLottie(newAnimation);

          toast({
            title: "Success",
            description: `Lottie animation "${fileName}" loaded successfully!`,
          });

          // Try to save to backend (optional)
          try {
            const formData = new FormData();
            formData.append('lottieFile', file);
            formData.append('animationData', JSON.stringify({
              id: newAnimation.id,
              name: newAnimation.name
            }));

            const response = await fetch("/api/users/upload-lottie", {
              method: "POST",
              body: formData,
              credentials: 'include'
            });

            if (response.ok) {
              const result = await response.json();
              console.log('✅ Backend upload successful:', result);

              // Update the animation with server path
              setLottieAnimations(prev => prev.map(anim => 
                anim.id === newAnimation.id ? { ...anim, path: result.path } : anim
              ));
            } else {
              console.warn('⚠️ Backend upload failed, keeping local version');
            }
          } catch (uploadError) {
            console.warn("Backend upload failed, keeping local version:", uploadError);
            // Keep the local version even if backend fails
          }

        } catch (parseError) {
          console.error("Parse error:", parseError);
          toast({
            title: "Upload Error",
            description: parseError.message || "Invalid Lottie JSON file format",
            variant: "destructive",
          });
        }
      };

      reader.onerror = () => {
        toast({
          title: "File Read Error",
          description: "Failed to read the uploaded file",
          variant: "destructive",
        });
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload Error",
        description: "Failed to process Lottie file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Determine the avatar source - using our tracked URL with cache busting
  const avatarSrc = profilePictureUrl || null; // Use null to trigger the fallback

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile picture card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mb-4 relative cursor-pointer"
                onClick={handleProfilePictureClick}
              >
                <Avatar className="h-32 w-32 border-2 border-primary/20">
                  <AvatarImage 
                    src={avatarSrc} 
                    key={avatarKey}
                    onError={(e) => {
                      console.error("Avatar image failed to load:", e);
                      // If image fails to load, force fallback by setting src to empty
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/80 to-primary/40">
                    {(fetchedCurrentUser?.firstName?.charAt(0)?.toUpperCase() || '') + (fetchedCurrentUser?.lastName?.charAt(0)?.toUpperCase() || '') || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                {uploading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
                  >
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </motion.div>
                )}
              </motion.div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp,application/json,.json"
                className="hidden"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Supported formats: JPEG, PNG, GIF, WebP, Lottie JSON<br />
                Max file size: 2MB (images), 20MB (Lottie)
              </p>
              <Button 
                variant="outline"
                onClick={handleProfilePictureClick}
                disabled={uploading}
              >
                Change Picture
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Click the button or image to upload a new profile picture.
              </p>
            </CardContent>
          </Card>

          {/* Profile settings tabs */}
          <Card className="md:col-span-2">
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
                 {/* Avatar Animation Tab */}
                <TabsContent value="avatar">
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Select Avatar Animation</h3>
                        <p className="text-sm text-muted-foreground">Choose a Lottie animation for your avatar</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Lottie
                      </Button>
                    </div>

                    {/* Debug Panel */}
                    <LottieFileDebug 
                      onTestResults={(testResults) => {
                        console.log('🧪 Debug results:', testResults);
                        const validFiles = testResults
                          .filter(r => r.status === 'VALID_LOTTIE')
                          .map(r => r.file);
                        setPlayingAnimations(new Set(validFiles));

                        // Update the available animations based on debug results
                        const loadedAnimations = testResults.map(result => ({
                          id: result.file.replace('/lottie/', '').replace('.json', ''),
                          name: result.file.replace('/lottie/', '').replace('.json', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          path: result.file,
                          preview: result.data
                        }));

                        setLottieAnimations(loadedAnimations);

                        if (testResults.length === 0) {
                          toast({
                            title: "No Lottie Files Found",
                            description: "No Lottie files were found. Check the debug panel for details.",
                            variant: "destructive",
                          });
                        }
                      }}
                    />

                    {/* Current Selection Display */}
                    {selectedLottie && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <h4 className="font-medium mb-2">Current Selection</h4>
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 flex items-center justify-center border rounded">
                            <LottieFromPublic
                              animationPath={selectedLottie.path}
                              width={60}
                              height={60}
                              loop={true}
                              autoplay={true}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{selectedLottie.name}</p>
                            <p className="text-sm text-muted-foreground">Currently selected as your avatar</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Animation Grid */}
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                      {lottieAnimations.map((animation) => (
                        <motion.div
                          key={animation.id}
                          className={`relative rounded-lg border p-4 cursor-pointer hover:shadow-lg transition-all duration-300 ${
                            selectedLottie?.id === animation.id 
                              ? 'border-primary border-2 shadow-lg bg-primary/5' 
                              : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                          }`}
                          onClick={() => handleLottieSelect(animation)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="relative">
                            <div className="w-full h-24 flex items-center justify-center mb-2">
                              <LottieFromPublic
                                animationPath={animation.path}
                                width={80}
                                height={80}
                                loop={true}
                                autoplay={true}
                                onLoad={(data) => handleAnimationLoad(animation.id, data)}
                                onError={(error) => handleAnimationError(animation.id, error)}
                              />
                            </div>

                            {/* Success indicator */}
                            {loadedAnimations.has(animation.id) && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full opacity-75" title="Animation loaded"></div>
                            )}

                            {/* Selection Indicator */}
                            {selectedLottie?.id === animation.id && (
                              <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center pointer-events-none">
                                <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                                  ✓ Selected
                                </div>
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-center font-medium truncate">{animation.name}</p>

                          {/* Loading State */}
                          {updateLottieAvatarMutation.isPending && selectedLottie?.id === animation.id && (
                            <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Upload Instructions */}
                    <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Upload Instructions:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Upload Lottie JSON files (max 20MB)</li>
                        <li>Ensure your JSON file contains valid Lottie animation data</li>
                        <li>Animations will be automatically validated before upload</li>
                        <li>Click on any animation to set it as your avatar</li>
                      </ul>
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