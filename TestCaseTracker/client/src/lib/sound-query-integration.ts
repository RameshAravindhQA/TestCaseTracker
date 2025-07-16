
import { QueryClient } from '@tanstack/react-query';
import { playApiSound } from './sound-api-integration';

export const createSoundEnabledQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          // Play error sound on query failure
          if (failureCount === 0) {
            playApiSound('GET', false);
          }
          return failureCount < 3;
        },
      },
      mutations: {
        onSuccess: (data, variables, context: any) => {
          // Determine the HTTP method from the mutation context
          const method = context?.method || 'POST';
          playApiSound(method, true);
        },
        onError: (error, variables, context: any) => {
          // Determine the HTTP method from the mutation context
          const method = context?.method || 'POST';
          playApiSound(method, false);
        },
      },
    },
  });
};

// Hook to create mutation with sound integration
export const useSoundMutation = (options: any) => {
  return {
    ...options,
    onSuccess: (...args: any[]) => {
      const method = options.method || 'POST';
      playApiSound(method, true);
      if (options.onSuccess) {
        options.onSuccess(...args);
      }
    },
    onError: (...args: any[]) => {
      const method = options.method || 'POST';
      playApiSound(method, false);
      if (options.onError) {
        options.onError(...args);
      }
    },
  };
};
