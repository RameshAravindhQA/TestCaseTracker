
import { QueryClient } from '@tanstack/react-query';
import { playSoundForApiResponse, playErrorSound } from './sound-api-integration';

export function setupQuerySounds(queryClient: QueryClient) {
  // Set up global error handling for queries
  queryClient.setDefaultOptions({
    queries: {
      onError: (error) => {
        console.error('Query error:', error);
        playErrorSound();
      },
      onSuccess: () => {
        // Only play success sound for explicit data fetching, not automatic background refetches
      }
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        playErrorSound();
      },
      onSuccess: (data, variables, context) => {
        // Determine operation type from mutation key or context
        const mutationKey = context?.mutationKey || [];
        const operation = mutationKey.includes('create') ? 'create' :
                         mutationKey.includes('update') ? 'update' :
                         mutationKey.includes('delete') ? 'delete' : 'read';
        
        playSoundForApiResponse(true, operation);
      }
    }
  });
}
