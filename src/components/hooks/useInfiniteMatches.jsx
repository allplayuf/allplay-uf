import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CACHE_STRATEGIES } from '../providers/QueryProvider';

const MATCHES_PER_PAGE = 20;

export function useInfiniteMatches(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['matches-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Fetch matches with pagination
      const allMatches = await base44.entities.Match.list('-date', 200);
      
      // Apply filters
      let filteredMatches = allMatches;
      const today = new Date().toISOString().split('T')[0];
      
      // Filter by status and date, EXCLUDE cup matches
      filteredMatches = filteredMatches.filter(m => 
        m.status === 'upcoming' && m.date >= today && !m.is_cup_match
      );
      
      // Apply city filter if provided
      if (filters.city) {
        filteredMatches = filteredMatches.filter(m => {
          const venue = filters.venues?.find(v => v.id === m.venue_id);
          return venue?.city?.toLowerCase() === filters.city.toLowerCase();
        });
      }
      
      // Apply skill level filter
      if (filters.skill_level && filters.skill_level !== 'all') {
        filteredMatches = filteredMatches.filter(m => 
          m.is_team_match || 
          !m.skill_bracket || 
          m.skill_bracket === 'mixed' || 
          m.skill_bracket === filters.skill_level
        );
      }
      
      // Apply date filter
      if (filters.date === 'today') {
        filteredMatches = filteredMatches.filter(m => m.date === today);
      }
      
      // Pagination
      const start = pageParam * MATCHES_PER_PAGE;
      const end = start + MATCHES_PER_PAGE;
      const paginatedMatches = filteredMatches.slice(start, end);
      
      return {
        matches: paginatedMatches,
        nextPage: end < filteredMatches.length ? pageParam + 1 : undefined,
        hasMore: end < filteredMatches.length,
        total: filteredMatches.length
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC, // Matches are semi-dynamic
    keepPreviousData: true,
  });
}