import { z } from "zod";
// No longer using useState for password visibility
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Mail, Lock, Github } from "lucide-react";
import { useState } from "react";
// LoginMotivationDialog removed to prevent blur screen issues
import { SoundButton } from "@/components/ui/sound-button";
import { SoundDebug } from '@/components/sound-debug';
import { LoginSuccessDialog } from '@/components/ui/login-success-dialog';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  // No longer need to manage password visibility state as it's handled by the PasswordInput component
  // Removed motivation dialog state to prevent blur screen
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [userName, setUserName] = useState('');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      console.log("Login attempt with:", credentials.email);
      const result = await login(credentials);
      console.log("Login response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Login successful, user data:", data);
      toast({
        title: "Login successful",
        description: "You have been logged in to your account",
      });

      // Invalidate the user data query to refetch with new credentials
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      // Store authentication status in localStorage for persistence across page reloads
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', data.firstName || data.name || data.email);
      localStorage.setItem('userId', data.id?.toString() || '');
      localStorage.setItem('loginTime', new Date().toISOString());

      // User login successful, storing basic info
      const firstName = data.firstName || (data.name ? data.name.split(' ')[0] : data.email.split('@')[0]);
      setUserName(firstName);
      console.log("User logged in:", firstName);

      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      setShowWelcomeDialog(true);

      // Don't navigate immediately, wait for welcome dialog to close
    },
    onError: (error: any) => {
      console.error("Login error:", error);

      // Check for 404 status code or message that indicates user not found
      if (error.status === 404 || 
          (error.message && (
            error.message.toLowerCase().includes("not found") || 
            error.message.toLowerCase().includes("no user") ||
            error.message.toLowerCase().includes("invalid email")
          ))
      ) {
        toast({
          title: "User Not Found",
          description: "The email you entered is not registered in our system. Please check your email or register for a new account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: error.message || "Authentication failed. Please check your credentials.",
          variant: "destructive",
        });
      }
    },
  });

  const handleWelcomeDialogClose = () => {
    setShowWelcomeDialog(false);
    toast({
      title: "Login successful",
      description: "You have been logged in to your account",
    });
    navigate("/dashboard");
  };

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setIsOAuthLoading(provider);
      const response = await fetch(`/api/auth/${provider}/url`);
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
    } catch (error) {
      setIsOAuthLoading(null);
      toast({
        title: "OAuth Error",
        description: `Failed to initiate ${provider} login`,
        variant: "destructive",
      });
    }
  };

  // Function removed - no longer needed without motivation dialog

  return (
    <>
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl">
        <CardHeader className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <CardTitle className="text-2xl font-semibold text-center">
              Welcome Back
            </CardTitle>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-2 top-2.5 text-gray-400">
                            <Mail className="h-5 w-5" />
                          </div>
                          <Input 
                            type="email" 
                            placeholder="your.email@example.com"
                            className="pl-9" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <div className="absolute left-2 top-2.5 z-10 text-gray-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <FormControl>
                        <PasswordInput 
                          placeholder="••••••••" 
                          className="pl-9"
                          {...field} 
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SoundButton 
                type="submit" 
                className="w-full mt-6" 
                size="lg"
                disabled={loginMutation.isPending}
                soundType="click"
              >
                {loginMutation.isPending ? (
                  <>
                    <span className="mr-2">Logging in</span>
                    <span className="animate-spin">⟳</span>
                  </>
                ) : "Sign In"}
              </SoundButton>
              </form>
            </Form>
          </motion.div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin('google')}
                disabled={isOAuthLoading === 'google'}
              >
                {isOAuthLoading === 'google' ? (
                  <span className="animate-spin mr-2">⟳</span>
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => handleOAuthLogin('github')}
                disabled={isOAuthLoading === 'github'}
              >
                {isOAuthLoading === 'github' ? (
                  <span className="animate-spin mr-2">⟳</span>
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#181717">
                    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                GitHub
              </Button>
            </div>
          </div>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="mt-6 text-center space-y-2"
          >
            <Link href="/forgot-password">
              <motion.span
                whileHover={{ scale: 1.05, color: "#3B82F6" }}
                className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 cursor-pointer transition-colors"
              >
                Forgot your password?
              </motion.span>
            </Link>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link href="/register">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium cursor-pointer"
                >
                  Sign up
                </motion.span>
              </Link>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Welcome Dialog */}
      <LoginSuccessDialog 
        isOpen={showWelcomeDialog}
        onClose={handleWelcomeDialogClose}
        userName={userName}
      />
    </>
  );
}