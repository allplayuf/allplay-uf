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
  deleteMatch,
  deleteMatchRest,
  getPublicMatches,
  getMatchDetails,
  getMyParticipation,
  getMatchParticipants,
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
  getVenueByExternalId,
  getVenues,
  createVenue,
  deleteVenue,
  deleteVenues
} from './venuesService';

// Users
export {
  getMyProfile,
  getUsersByIds,
  getUserById,
  updateProfile
} from './usersService';

// User Cache
export {
  getCachedUser,
  primeUsers,
  fetchUsersMissing,
  clearUserCache,
  getUsers,
  getUser
} from './userCache';

// Participants
export {
  getMyParticipantMatchIds,
  getParticipantsForMatches,
} from './participantsService';

// Players
export {
  searchPlayers
} from './playersService';

// Teams
export {
  getTeams,
  getTeamById,
  getTeamMembers,
  getTeamMembersWithProfiles,
  getMyTeams,
  getMyTeamMemberships,
  createTeam as createSupabaseTeam,
  deleteTeamRest,
  updateTeam,
  inviteToTeam,
  requestJoinTeam
} from './teamsService';

// Reports
export {
  reportUser,
  reportMatch,
  getReports,
  handleReport
} from './reportsService';

// Admin
export {
  checkIsAdmin,
  clearAdminCache,
  getCachedAdminStatus
} from './adminService';

// Venue Availability
export {
  listVenueAvailability,
  createVenueAvailability,
  bulkCreateVenueAvailability,
  deleteVenueAvailability
} from './venueAvailabilityService';

// Friendships (single source of truth via Supabase REST)
export {
  getMyFriendships,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriendship,
  getFriendshipBetween,
  getFriendshipStatus
} from './friendshipsService';