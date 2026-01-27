/**
 * Supabase Services Index
 * 
 * ARCHITECTURE: Backend (Supabase RLS) is source of truth
 * 
 * All write operations go through Edge Functions (RLS enforced).
 * All read operations use REST API with auth token (RLS enforced).
 * 
 * Frontend:
 * - Never filters data for security (RLS does that)
 * - Only does UI-level filtering (e.g., city preference, date filter)
 * - Passes auth token with every request
 * - Lets backend decide what to return
 */

// Matches (writes via Edge Functions)
export {
  createMatch,
  joinMatch,
  leaveMatch,
  checkInMatch,
  getPublicMatches,
  getMatchDetails,
  getMyParticipation,
  getMatchParticipants,
  getMatchFeed,
  VALID_LEVELS,
  LEVEL_MAP,
  normalizeLevel
} from './matchesService';

// Matches (read queries)
export {
  getMatchesByIds,
  getMyMatches,
  getCompletedMatches,
  transformMatchData
} from './matchesQueries';

// Venues
export {
  upsertVenue,
  getVenues
} from './venuesService';

// Users
export {
  getMyProfile,
  getUsersByIds,
  getUserById
} from './usersService';

// Participants
export {
  getMyParticipantMatchIds,
  getParticipantsForMatches,
  getAllParticipants
} from './participantsService';

// Reports
export {
  reportUser,
  getReports,
  handleReport
} from './reportsService';