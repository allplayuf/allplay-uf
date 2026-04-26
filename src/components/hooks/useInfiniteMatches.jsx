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
        const offset = pageParam * MATCHES_PER_PAGE;
        const raw = await getPublicMatches({
          status: 'upcoming',
          limit: MATCHES_PER_PAGE,
          offset,
        });

        const today = new Date().toISOString().split('T')[0];

        let matches = (raw || []).map(m => ({
          ...m,
          date: m.starts_at ? m.starts_at.split('T')[0] : null,
          time: m.starts_at ? m.starts_at.split('T')[1]?.substring(0, 5) : null,
          skill_bracket: m.level || 'mixed',
          _venue_name: m.venue_name,
          _venue_city: m.venue_city,
          _venue_address: m.venue_address,
          _venue_lat: m.venue_lat,
          _venue_lng: m.venue_lng,
        }));

        // Display-level filtering only (not security-related)
        matches = matches.filter(m => m && m.date >= today && !m.is_cup_match);

        if (filters.city) {
          matches = matches.filter(m =>
            m._venue_city?.toLowerCase() === filters.city.toLowerCase()
          );
        }

        if (filters.skill_level && filters.skill_level !== 'all') {
          matches = matches.filter(m =>
            m.is_team_match ||
            !m.skill_bracket ||
            m.skill_bracket === 'mixed' ||
            m.skill_bracket === filters.skill_level
          );
        }

        if (filters.date === 'today') {
          matches = matches.filter(m => m.date === today);
        }

        const hasMore = raw.length === MATCHES_PER_PAGE;

        return {
          matches,
          nextPage: hasMore ? pageParam + 1 : undefined,
          hasMore,
          total: matches.length,
        };
      } catch (error) {
        console.error('Error fetching matches:', error);
        return {
          matches: [],
          nextPage: undefined,
          hasMore: false,
          total: 0,
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