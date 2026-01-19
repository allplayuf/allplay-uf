
/**
 * Supabase Services Index
 * 
 * Re-export all service functions for easy imports.
 */

// Matches
export {
  createMatch,
  joinMatch,
  leaveMatch,
  checkInMatch,
  getPublicMatches,
  getMatchDetails,
  getMyParticipation,
  getMatchParticipants,
  // Level utilities
  VALID_LEVELS,
  LEVEL_MAP,
  normalizeLevel
} from './matchesService';

// Venues
export {
  upsertVenue,
  getVenues
} from './venuesService';

// Reports
export {
  reportUser,
  getReports,
  handleReport
} from './reportsService';
