/**
 * useMatchFeed — Single-query hook for enriched match feed
 * 
 * Returns matches + participants + avatars in one query.
 * No waterfall loading.
 */

import { useQuery } from '@tanstack/react-query';
import { CACHE_STRATEGIES } from '../providers/QueryProvider';
import { getMatchFeedEnriched } from '../supabase/services/matchFeedService';

export const MATCH_FEED_KEY = ['match-feed-enriched'];

export function useMatchFeed(filters = {}) {
  return useQuery({
    queryKey: [...MATCH_FEED_KEY, filters],
    queryFn: () => getMatchFeedEnriched({ status: 'upcoming' }),
    ...CACHE_STRATEGIES.SEMI_DYNAMIC,
    select: (data) => {
      if (!data) return { matches: [], participantsByMatch: {}, userAvatars: {}, myMatchIds: new Set() };

      let matches = [...data.matches];
      const today = new Date().toISOString().split('T')[0];

      // Filter out cup matches and past matches
      matches = matches.filter(m => m && m.status === 'upcoming' && m.date >= today && !m.is_cup_match);

      // City filter
      if (filters.city) {
        matches = matches.filter(m =>
          m._venue_city?.toLowerCase() === filters.city.toLowerCase()
        );
      }

      // Skill level filter
      if (filters.skill_level && filters.skill_level !== 'all') {
        matches = matches.filter(m =>
          m.is_team_match ||
          !m.skill_bracket ||
          m.skill_bracket === 'mixed' ||
          m.skill_bracket === filters.skill_level
        );
      }

      // Today filter
      if (filters.date === 'today') {
        matches = matches.filter(m => m.date === today);
      }

      // Sort by starts_at ASC
      matches.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateA - dateB;
      });

      return {
        matches,
        participantsByMatch: data.participantsByMatch,
        userAvatars: data.userAvatars,
        myMatchIds: data.myMatchIds,
      };
    },
  });
}