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
import { Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
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

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
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
