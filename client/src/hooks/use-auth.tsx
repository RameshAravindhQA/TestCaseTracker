import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
};

type LoginData = {
  email: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Initialize from localStorage on mount
  useEffect(() => {
    console.log('🔄 AUTH PROVIDER: Initializing from localStorage');
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    
    if (storedAuth === 'true' && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ AUTH PROVIDER: Restored user from localStorage:', parsedUser.email);
        setLocalUser(parsedUser);
      } catch (error) {
        console.warn('⚠️ AUTH PROVIDER: Failed to parse stored user:', error);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
      }
    }
    setHasInitialized(true);
  }, []);
  
  const {
    data: apiUser,
    error,
    isLoading: apiLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: hasInitialized, // Only start API call after localStorage check
    retry: (failureCount, error) => {
      console.log('🔄 AUTH RETRY:', { failureCount, error: error?.message });
      return failureCount < 2;
    },
    onSuccess: (data) => {
      console.log('✅ AUTH API SUCCESS:', data ? { id: data.id, email: data.email } : 'No user');
      if (data) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(data));
        setLocalUser(data);
      } else {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        setLocalUser(null);
      }
    },
    onError: (error) => {
      console.log('❌ AUTH API ERROR:', error.message);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      setLocalUser(null);
    }
  });

  // Determine final user and loading state
  const user = apiUser || localUser;
  const isLoading = !hasInitialized || (hasInitialized && apiLoading && !localUser);
  const isAuthenticated = !!user;

  // Debug logging
  useEffect(() => {
    console.log('🔍 AUTH STATE UPDATE:', {
      hasInitialized,
      apiUser: apiUser ? { id: apiUser.id, email: apiUser.email } : null,
      localUser: localUser ? { id: localUser.id, email: localUser.email } : null,
      finalUser: user ? { id: user.id, email: user.email } : null,
      isLoading,
      isAuthenticated,
      apiLoading
    });
  }, [hasInitialized, apiUser, localUser, user, isLoading, isAuthenticated, apiLoading]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      console.log('✅ LOGIN SUCCESS:', { id: user.id, email: user.email });
      queryClient.setQueryData(["/api/auth/user"], user);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      setLocalUser(user);
    },
    onError: (error: Error) => {
      console.log('❌ LOGIN ERROR:', error.message);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      console.log('✅ REGISTER SUCCESS:', { id: user.id, email: user.email });
      queryClient.setQueryData(["/api/auth/user"], user);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      setLocalUser(user);
    },
    onError: (error: Error) => {
      console.log('❌ REGISTER ERROR:', error.message);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      console.log('✅ LOGOUT SUCCESS');
      queryClient.setQueryData(["/api/auth/user"], null);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      setLocalUser(null);
    },
    onError: (error: Error) => {
      console.log('❌ LOGOUT ERROR:', error.message);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAuthenticated,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}