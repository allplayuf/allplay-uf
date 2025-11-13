import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TEAMS_PER_PAGE = 20;

export function useInfiniteTeams(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['teams-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Build query parameters
      const params = new URLSearchParams({
        limit: TEAMS_PER_PAGE.toString(),
        offset: pageParam.toString()
      });

      // Add filters
      if (filters.city) params.append('city', filters.city);
      if (filters.search) params.append('search', filters.search);

      // Call backend function with parameters
      const response = await base44.functions.invoke('getPublicTeams', {}, {
        params: params.toString()
      });

      return {
        teams: response.data.teams || [],
        nextOffset: response.data.nextOffset,
        hasMore: response.data.hasMore,
        totalCount: response.data.totalCount
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
}