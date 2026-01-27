import { useInfiniteQuery } from '@tanstack/react-query';
import { CACHE_STRATEGIES } from '../providers/QueryProvider';
import { getPublicMatches } from '../supabase/services';

const MATCHES_PER_PAGE = 20;

/**
 * Fetch matches from Supabase public_matches VIEW
 * 
 * ARCHITECTURE: Backend (RLS) is source of truth
 * - View already returns only matches user can see
 * - Always sorted by starts_at ASC from backend
 * - Frontend only handles display-level filtering (city, skill level UI preference)
 */
export function useInfiniteMatches(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['matches-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        // Fetch from public_matches VIEW - RLS handles access control
        // Backend already sorts by starts_at ASC
        const allMatches = await getPublicMatches({ status: 'upcoming' });
        
        // Transform view data to match expected format
        let matches = (allMatches || []).map(m => ({
          ...m,
          date: m.starts_at ? m.starts_at.split('T')[0] : null,
          time: m.starts_at ? m.starts_at.split('T')[1]?.substring(0, 5) : null,
          skill_bracket: m.level || 'mixed',
          venue_id: m.venue_id,
          venue_external_id: m.venue_external_id,
          _venue_name: m.venue_name,
          _venue_city: m.venue_city,
          _venue_address: m.venue_address,
          _venue_lat: m.venue_lat,
          _venue_lng: m.venue_lng,
        }));

        const today = new Date().toISOString().split('T')[0];
        
        // Display-level filtering only (not security-related)
        // Exclude cup matches from general feed, filter past matches
        matches = matches.filter(m => 
          m && m.status === 'upcoming' && m.date >= today && !m.is_cup_match
        );
      
        // UI preference: city filter
        if (filters.city) {
          matches = matches.filter(m => 
            m._venue_city?.toLowerCase() === filters.city.toLowerCase()
          );
        }
      
        // UI preference: skill level filter
        if (filters.skill_level && filters.skill_level !== 'all') {
          matches = matches.filter(m => 
            m.is_team_match || 
            !m.skill_bracket || 
            m.skill_bracket === 'mixed' || 
            m.skill_bracket === filters.skill_level
          );
        }
      
        // UI preference: today only
        if (filters.date === 'today') {
          matches = matches.filter(m => m.date === today);
        }
      
        // Already sorted by starts_at ASC from backend, but ensure consistency
        matches.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
          const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
          return dateA - dateB;
        });

        // Pagination
        const start = pageParam * MATCHES_PER_PAGE;
        const end = start + MATCHES_PER_PAGE;
        const paginatedMatches = matches.slice(start, end);

        return {
          matches: paginatedMatches,
          nextPage: end < matches.length ? pageParam + 1 : undefined,
          hasMore: end < matches.length,
          total: matches.length
        };
      } catch (error) {
        console.error('Error fetching matches:', error);
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