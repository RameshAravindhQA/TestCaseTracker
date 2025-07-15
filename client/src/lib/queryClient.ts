import { QueryClient } from "@tanstack/react-query";

// Default query function
const defaultQueryFn = async ({ queryKey }: { queryKey: any[] }) => {
  const url = queryKey[0];
  if (typeof url !== 'string') {
    throw new Error('Query key must start with a URL string');
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Enhanced query function with options
export const getQueryFn = (options: { on401?: string } = {}) => {
  return async ({ queryKey }: { queryKey: any[] }) => {
    const url = queryKey[0];
    if (typeof url !== 'string') {
      throw new Error('Query key must start with a URL string');
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status === 401 && options.on401 === 'returnNull') {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return response;
}