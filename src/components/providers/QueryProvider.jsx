import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// OPTIMIZED Query Client with fine-tuned settings for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // CRITICAL DATA (User auth, permissions) - Very fresh, rarely refetch
      staleTime: 5 * 60 * 1000, // 5 minutes default
      cacheTime: 10 * 60 * 1000, // 10 minutes
      
      // Performance optimizations
      refetchOnWindowFocus: false, // Don't auto-refetch when user returns to tab
      refetchOnReconnect: false, // Don't refetch on network reconnect
      refetchOnMount: false, // Don't refetch if data exists in cache
      
      // Error handling
      retry: (failureCount, error) => {
        // Don't retry on rate limits or auth errors
        if (error?.message?.includes('rate limit') || 
            error?.message?.includes('Rate limit') ||
            error?.message?.includes('Unauthorized') ||
            error?.response?.status === 401 ||
            error?.response?.status === 403) {
          return false;
        }
        // Retry network errors max 2 times
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * 2 ** attemptIndex, 10000);
      },
      
      // Keep old data while fetching new
      keepPreviousData: true,
    },
  },
});

// Helper to create query keys with specific cache settings
export const createQueryKey = (key, options = {}) => {
  return {
    queryKey: Array.isArray(key) ? key : [key],
    ...options
  };
};

// Predefined cache strategies for different data types
export const CACHE_STRATEGIES = {
  // User authentication - Very stable, long cache
  AUTH: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  // Static data (venues, badges) - Very stable
  STATIC: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  // Semi-dynamic data (matches, teams) - Moderate freshness
  SEMI_DYNAMIC: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  // Highly dynamic data (chat, notifications) - Fresh data needed
  DYNAMIC: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Refetch when user returns
    refetchOnMount: 'always',
  },
  
  // Realtime data (match participants, live scores) - Always fresh
  REALTIME: {
    staleTime: 10 * 1000, // 10 seconds
    cacheTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  },
};

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };