import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  isFormData?: boolean;
}

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  body?: any,
  options?: { isFormData?: boolean }
): Promise<Response> {
  const config: RequestInit = {
    method,
    credentials: "include",
  };

  if (body !== undefined) {
    if (options?.isFormData || body instanceof FormData) {
      // For FormData, don't set Content-Type header (let browser set it with boundary)
      config.body = body;
      console.log(`FormData upload to ${url}:`, Array.from(body.entries()));
    } else {
      config.headers = {
        "Content-Type": "application/json",
      };
      config.body = JSON.stringify(body);
    }
  }

  console.log(`Starting ${method} request to ${url}`);

  const response = await fetch(url, config);

  if (!response.ok) {
    console.error(`API request failed: ${method} ${url}`, {
      status: response.status,
      statusText: response.statusText
    });
    throw new Error(`API request failed: ${method} ${url} {status: ${response.status}, statusText: '${response.statusText}'}`);
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Only retry network errors, not server errors
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
          return failureCount < 2; // Retry up to 2 times for network errors
        }
        return false; // Don't retry other errors
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
      gcTime: 10 * 60 * 1000, // 10 minutes
      // Add timeout to prevent API requests from hanging indefinitely
      networkMode: 'always',
    },
    mutations: {
      retry: false,
    },
  },
});