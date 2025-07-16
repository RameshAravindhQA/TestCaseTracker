import { apiRequest } from "@/lib/queryClient";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "Tester" | "Developer" | "Admin";
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export const login = async (credentials: LoginCredentials) => {
  const res = await apiRequest("POST", "/api/auth/login", credentials);
  return res.json();
};

export const register = async (data: RegisterData) => {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return res.json();
};

export const logout = async () => {
  const res = await apiRequest("POST", "/api/auth/logout", {});
  return res.json();
};

export const forgotPassword = async (data: ForgotPasswordData) => {
  const res = await apiRequest("POST", "/api/auth/forgot-password", data);
  return res.json();
};

export const resetPassword = async (data: ResetPasswordData) => {
  const res = await apiRequest("POST", "/api/auth/reset-password", data);
  return res.json();
};

export const fetchCurrentUser = async () => {
  // Try endpoints in order of preference
  const endpoints = ["/api/auth/user", "/api/user/current"];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        credentials: "include",
      });

      if (res.status === 401) {
        return null;
      }

      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error(`Error fetching from ${endpoint}:`, err);
      // Continue to next endpoint
    }
  }

  throw new Error("Failed to fetch user data from any endpoint");
};

export const useAuth = () => {
  return {
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    fetchCurrentUser,
  };
};

// Export the apiRequest function for use in other modules
export { apiRequest };

// Also provide a default export for backwards compatibility
export default apiRequest;