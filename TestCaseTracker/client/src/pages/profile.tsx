import React, { useState, useRef, useEffect } from "react";
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

  useEffect(() => {
    const loadAnimations = async () => {
      try {
        // Load only working animations
        const animationsToLoad = [
          { id: 'rocket', name: 'Rocket', path: '/lottie/rocket.json' },
          { id: 'businessman-rocket', name: 'Business Rocket', path: '/lottie/businessman-rocket.json' },
          { id: 'male-avatar', name: 'Male Avatar', path: '/lottie/male-avatar.json' },
          { id: 'female-avatar', name: 'Female Avatar', path: '/lottie/female-avatar.json' },
        ];

        const loadedAnimations = await Promise.all(
          animationsToLoad.map(async (animation) => {
            try {
              console.log(`🎬 Loading animation: ${animation.name} from ${animation.path}`);
              const response = await fetch(animation.path);
              if (response.ok) {
                const text = await response.text();
                // Check if we got HTML instead of JSON
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                  console.error(`❌ Received HTML instead of JSON for ${animation.name}`);
                  return { ...animation, preview: null };
                }
                const data = JSON.parse(text);
                console.log(`✅ Successfully loaded ${animation.name}`);
                return { ...animation, preview: data };
              } else {
                console.error(`❌ Failed to load ${animation.name} animation: ${response.status}`);
                return { ...animation, preview: null };
              }
            } catch (error) {
              console.error(`❌ Error loading ${animation.name} animation:`, error);
              return { ...animation, preview: null };
            }
          })
        );

        setLottieAnimations(loadedAnimations);

      } catch (error) {
        console.error('Error loading animations:', error);
      }
    };

    loadAnimations();
  }, []);

  // Fetch current user data
  const { data: currentUser, isLoading: isUserLoading } = useQuery<User>({
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
    }
  });

  // Get color theme from context
  const { colorTheme, setColorTheme } = useColorTheme();

  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: currentUser?.firstName || "",
      lastName: currentUser?.lastName || "",
      email: currentUser?.email || "",
      role: currentUser?.role || "",
      theme: currentUser?.theme || "default",
      colorTheme: colorTheme || "blue",
    },
  });

  // Update profile form when user data is loaded
  const { isSubmitting: isProfileSubmitting } = profileForm.formState;

  // Update default values when user data loads
  React.useEffect(() => {
    if (currentUser && !isProfileSubmitting) {
      profileForm.reset({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email,
        role: currentUser.role,
        theme: currentUser.theme || "default",
        colorTheme: currentUser.colorTheme || colorTheme || "blue",
      });
    }
  }, [currentUser, isProfileSubmitting, profileForm, colorTheme]);

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
      const response = await apiRequest("PUT", "/api/users/update-avatar", {
        profilePicture: lottieData.path,
        avatarType: 'lottie',
        avatarData: lottieData
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update avatar");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
    setSelectedLottie(animation);
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
    if (currentUser?.profilePicture) {
      setProfilePictureUrl(`${currentUser.profilePicture}?t=${Date.now()}`);
    }
  }, [currentUser]);

  // Refresh avatar key when the manual refresh is needed (like after upload)
  const refreshAvatar = () => {
    const newKey = Date.now();
    setAvatarKey(newKey);

    // Also update the URL with the new timestamp
    if (currentUser?.profilePicture) {
      setProfilePictureUrl(`${currentUser.profilePicture}?t=${newKey}`);
    }
  };

  const handleLottieFileUpload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast({
        title: "File too large",
        description: "Lottie file must be under 20MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);

          // Validate basic Lottie structure
          if (!jsonData.v || !jsonData.layers) {
            throw new Error("Invalid Lottie animation format - missing version or layers");
          }

          const animationId = `custom-${Date.now()}`;
          const newAnimation: LottieAnimation = {
            id: animationId,
            name: file.name.replace('.json', ''),
            path: URL.createObjectURL(file),
            preview: jsonData
          };

          console.log('📁 Created Lottie animation:', newAnimation);

          // Add to animations list immediately for UI feedback
          setLottieAnimations(prev => [...prev, newAnimation]);

          toast({
            title: "Success",
            description: "Lottie animation loaded successfully!",
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
            title: "Error",
            description: "Invalid Lottie JSON file format",
            variant: "destructive",
          });
        }
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Error",
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
                    {(currentUser?.firstName?.charAt(0)?.toUpperCase() || '') + (currentUser?.lastName?.charAt(0)?.toUpperCase() || '') || "U"}
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
                            >
                              <FormControl>
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
                  <div className="space-y-4 pt-4">
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

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                      {lottieAnimations.map((animation) => (
                        <motion.div
                          key={animation.id}
                          className={`relative rounded-md border p-4 cursor-pointer hover:shadow-md transition-all duration-300 ${
                            selectedLottie?.id === animation.id 
                              ? 'border-primary border-2 shadow-lg' 
                              : 'border-muted hover:border-primary/50'
                          }`}
                          onClick={() => handleLottieSelect(animation)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="relative">
                            <div className="w-full h-24 flex items-center justify-center">
                              {animation.preview ? (
                                <Lottie
                                  animationData={animation.preview}
                                  loop={true}
                                  autoplay={playingAnimations.has(animation.id)}
                                  style={{ height: 80, width: 80 }}
                                  onError={(error) => {
                                    console.error(`❌ Lottie render error for ${animation.name}:`, error);
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  <p className="text-xs text-muted-foreground">Loading...</p>
                                </div>
                              )}
                            </div>
                            {animation.preview && (
                              <div className="absolute top-0 right-0 p-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAnimation(animation.id);
                                  }}
                                >
                                  {playingAnimations.has(animation.id) ? (
                                    <Pause className="h-3 w-3" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-center mt-2 font-medium">{animation.name}</p>
                          {selectedLottie?.id === animation.id && (
                            <div className="absolute inset-0 bg-primary/10 rounded-md flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                                Selected
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
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