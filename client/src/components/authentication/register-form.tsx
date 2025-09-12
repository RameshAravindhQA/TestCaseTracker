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
import { register as registerUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
// Eye and EyeOff icons are now part of the PasswordInput component
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const registerSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["Tester", "Developer", "Admin"], {
    description: "User role defines access and permissions: Tester (basic testing access), Developer (code-related access), Admin (full system access)"
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  // No longer need to manage password visibility state as it's handled by the PasswordInput component

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "Tester", // Auto-populate with Tester as default
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now login.",
      });
      navigate("/login");
    },
    onError: (error: any) => {
      let errorMessage = "Registration failed. Please try again.";
      
      if (error?.message) {
        if (error.message.includes("already exists")) {
          errorMessage = "User already exists with this email id";
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        if (error.includes("already exists")) {
          errorMessage = "User already exists with this email id";
        } else {
          errorMessage = error;
        }
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl">
      <CardHeader className="space-y-1">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
          <CardTitle className="text-2xl font-semibold text-center">
            Create Account
          </CardTitle>
        </motion.div>
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
          <CardDescription className="text-center">
            Sign up to get started with TestCaseTracker
          </CardDescription>
        </motion.div>
      </CardHeader>
      <CardContent>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Smith" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="your.email@example.com" 
                      {...field} 
                    />
                  </FormControl>
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
                  <FormControl>
                    <PasswordInput 
                      placeholder="••••••••" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Tester">Tester</SelectItem>
                      <SelectItem value="Developer">Developer</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.value === "Tester" && "Basic testing access - Create and execute test cases"}
                      {field.value === "Developer" && "Code-related access - Bug management and development tasks"}
                      {field.value === "Admin" && "Full system access - User management and system administration"}
                    </p>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating account..." : "Register"}
            </Button>
            </form>
          </Form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium cursor-pointer"
              >
                Sign in
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}