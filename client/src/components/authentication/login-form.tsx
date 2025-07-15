import { z } from "zod";
import { useState } from "react";
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
import { playSound } from "@/utils/sound-effects";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      try {
        console.log("Login attempt with:", credentials.email);
        const result = await login(credentials);
        console.log("Login response:", result);
        return result;
      } catch (error) {
        console.error("Login mutation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        console.log("Login successful, user data:", data);
        playSound('login');
        toast({
          title: "Login successful",
          description: "You have been logged in to your account",
        });

        // Invalidate the user data query to refetch with new credentials
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }).catch(err => {
          console.warn("Query invalidation warning:", err);
        });

        // Set authentication status
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("justLoggedIn", "true"); // Flag for welcome dialog

        // Dispatch custom event for login success
        const loginEvent = new CustomEvent('loginSuccess', {
          detail: { user: data }
        });
        window.dispatchEvent(loginEvent);

        console.log("Login successful, dispatched loginSuccess event");
        // The login page will handle showing the welcome dialog
      } catch (error) {
        console.error("Login success handler error:", error);
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      playSound('error');
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    playSound('click');
    loginMutation.mutate(data);
  };

  const handleOAuthLogin = async (provider: string) => {
    setIsOAuthLoading(provider);
    playSound('click');
    try {
      // OAuth login logic would go here
      toast({
        title: "OAuth Login",
        description: `${provider} login coming soon!`,
      });
    } catch (error) {
      toast({
        title: "OAuth Error",
        description: "OAuth login failed",
        variant: "destructive",
      });
    } finally {
      setIsOAuthLoading(null);
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
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-2 top-2.5 text-gray-400 z-10">
                          <Lock className="h-5 w-5" />
                        </div>
                        <PasswordInput 
                          placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              onMouseEnter={() => playSound('hover')}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              disabled={isOAuthLoading === 'google'}
              onMouseEnter={() => playSound('hover')}
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
              onMouseEnter={() => playSound('hover')}
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
        <div className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}