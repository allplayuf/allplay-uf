import { useInfiniteQuery } from '@tanstack/react-query';
import { CACHE_STRATEGIES } from '../providers/QueryProvider';
import { getPublicMatches } from '../supabase/services';

const MATCHES_PER_PAGE = 20;

/**
 * Fetch matches from Supabase public_matches VIEW
 * This view provides all necessary venue info inline
 */
export function useInfiniteMatches(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['matches-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        // Fetch from Supabase public_matches VIEW (NOT Base44 entities)
        const allMatches = await getPublicMatches({ status: 'upcoming' });
        
        // Transform view data to match expected format
        let filteredMatches = (allMatches || []).map(m => ({
          ...m,
          // Map view fields to expected field names
          date: m.starts_at ? m.starts_at.split('T')[0] : null,
          time: m.starts_at ? m.starts_at.split('T')[1]?.substring(0, 5) : null,
          skill_bracket: m.level || 'mixed',
          // Venue info is inline from view
          venue_id: m.venue_id,
          venue_external_id: m.venue_external_id,
          _venue_name: m.venue_name,
          _venue_city: m.venue_city,
          _venue_address: m.venue_address,
          _venue_lat: m.venue_lat,
          _venue_lng: m.venue_lng,
        }));

        const today = new Date().toISOString().split('T')[0];
        
        // Filter by status and date, EXCLUDE cup matches
        filteredMatches = filteredMatches.filter(m => 
          m && m.status === 'upcoming' && m.date >= today && !m.is_cup_match
        );
      
        // Apply city filter if provided (use inline venue_city from view)
        if (filters.city) {
          filteredMatches = filteredMatches.filter(m => 
            m._venue_city?.toLowerCase() === filters.city.toLowerCase()
          );
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
      
        // Sort by date/time
        filteredMatches.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
          const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
          return dateA - dateB;
        });

        // Pagination
        const start = pageParam * MATCHES_PER_PAGE;
        const end = start + MATCHES_PER_PAGE;
        const paginatedMatches = filteredMatches.slice(start, end);
      
        console.log('[useInfiniteMatches] Returning', paginatedMatches.length, 'of', filteredMatches.length, 'matches');

        return {
          matches: paginatedMatches,
          nextPage: end < filteredMatches.length ? pageParam + 1 : undefined,
          hasMore: end < filteredMatches.length,
          total: filteredMatches.length
        };
      } catch (error) {
        console.error('Error fetching matches from Supabase:', error);
        return {
          matches: [],
          nextPage: undefined,
          hasMore: false,
          total: 0
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    keepPreviousData: true,
    retry: 2,
    retryDelay: 1000,
  });
}