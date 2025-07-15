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

export async function login(credentials: { email: string; password: string }) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include",
    });

    if (!response.ok) {
      let errorMessage = "Login failed";
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (parseError) {
        console.warn("Failed to parse error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Login function error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during login");
  }
}

export const register = async (data: RegisterData) => {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return await res.json();
};

export const logout = async () => {
  const res = await apiRequest("POST", "/api/auth/logout", {});
  return await res.json();
};

export const forgotPassword = async (data: ForgotPasswordData) => {
  const res = await apiRequest("POST", "/api/auth/forgot-password", data);
  return await res.json();
};

export const resetPassword = async (data: ResetPasswordData) => {
  const res = await apiRequest("POST", "/api/auth/reset-password", data);
  return await res.json();
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