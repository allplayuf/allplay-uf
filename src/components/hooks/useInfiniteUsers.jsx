import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const USERS_PER_PAGE = 20;

export function useInfiniteUsers(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['users-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        // Build query parameters
        const params = new URLSearchParams({
          limit: USERS_PER_PAGE.toString(),
          offset: pageParam.toString()
        });

        // Add filters
        if (filters.city) params.append('city', filters.city);
        if (filters.skill_level && filters.skill_level !== 'all') {
          params.append('skill_level', filters.skill_level);
        }
        if (filters.search) params.append('search', filters.search);

        // Call backend function with parameters
        const response = await base44.functions.invoke('getPublicUsers', {}, {
          params: params.toString()
        });

        return {
          users: response?.data?.users || [],
          nextOffset: response?.data?.nextOffset,
          hasMore: response?.data?.hasMore || false,
          totalCount: response?.data?.totalCount || 0
        };
      } catch (error) {
        console.error('Error fetching users:', error);
        return {
          users: [],
          nextOffset: undefined,
          hasMore: false,
          totalCount: 0
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage?.nextOffset,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    keepPreviousData: true,
    retry: 2,
    retryDelay: 1000,
  });
}