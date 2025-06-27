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
      
      // Force redirect with hard page reload
      console.log("Login successful, redirecting to dashboard...");
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('lastLoginTime', new Date().toString());
      // Use absolute URL to ensure proper redirection
      window.location.href = window.location.origin + "/dashboard";
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

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Sign in to NavaDhiti</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <Button 
              type="submit" 
              className="w-full mt-6" 
              size="lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <span className="mr-2">Logging in</span>
                  <span className="animate-spin">⟳</span>
                </>
              ) : "Sign In"}
            </Button>
          </form>
        </Form>
        
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
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
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
                <Github className="w-5 h-5 mr-2" />
              )}
              GitHub
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot your password?
          </Link>
        </div>
        <div className="text-sm text-center">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">Register</Link>
        </div>
      </CardFooter>
    </Card>
  );
}
