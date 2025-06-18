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
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: ApiRequestOptions
): Promise<Response> {
  const isFormData = options?.isFormData || false;
  let headers: Record<string, string> = {};
  let body: any = undefined;
  
  if (data) {
    if (isFormData && data instanceof FormData) {
      // For FormData, don't set Content-Type header as browser will set it with boundary
      body = data;
      console.log("Sending FormData", Array.from(data.entries()).map(([key, val]) => 
        `${key}: ${val instanceof File ? `${val.name} (${val.type}, ${val.size} bytes)` : val}`
      ));
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
