/**
 * Supabase Integration Module
 * 
 * Central export point for all Supabase-related functionality.
 * Architecture:
 * - config.js: URL constants and cached anon key fetching
 * - callEdgeFunction.js: Shared Edge Function caller with auth handling
 * - client.js: Session management and auth state
 * - services/*.js: Domain-specific service functions
 */

// =============================================================================
// CONFIGURATION
// =============================================================================
export { getSupabaseConfig, SUPABASE_URL, SUPABASE_FUNCTIONS_URL } from './config';

// =============================================================================
// EDGE FUNCTION CALLER (use this for new Edge Function calls)
// =============================================================================
export { callEdgeFunction, callPublicEdgeFunction } from './callEdgeFunction';

// =============================================================================
// CLIENT & SESSION MANAGEMENT
// =============================================================================
export { 
  supabaseClient,
  sessionStore,
  AUTH_STATES,
  initSupabase,
  login,
  logout
} from './client';

// =============================================================================
// AUTH PROVIDER & HOOKS (React integration)
// =============================================================================
export { 
  SupabaseAuthProvider, 
  useSupabaseAuth,
  withAuth 
} from './AuthProvider';

// =============================================================================
// GUEST GUARD COMPONENTS (UI protection)
// =============================================================================
export {
  useGuestGuard,
  AuthRequiredButton,
  GuestOverlay,
  AuthOnly,
  RoleOnly,
  AdminOnly,
  CupAdminOnly,
  ModeratorOnly
} from './GuestGuard';

// =============================================================================
// LOGIN MODAL
// =============================================================================
export { default as LoginModal } from './LoginModal';

// =============================================================================
// SERVICES - Domain-specific operations
// =============================================================================
export {
  // Matches (writes)
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
  normalizeLevel,
  // Matches (reads)
  getMatchesByIds,
  getMyMatches,
  getCompletedMatches,
  transformMatchData,
  // Venues
  upsertVenue,
  getVenues,
  // Users
  getMyProfile,
  getUsersByIds,
  getUserById,
  // Participants
  getMyParticipantMatchIds,
  getParticipantsForMatches,
  getAllParticipants,
  // Reports
  reportUser,
  getReports,
  handleReport
} from './services';

// LEGACY matchService.js removed - use services/* instead

// =============================================================================
// CONVENIENCE HELPERS - DEPRECATED
// Use useSupabaseAuth() hook instead for React components
// These only affect UI rendering - backend RLS is source of truth
// =============================================================================
import { sessionStore as _sessionStore } from './client';

/** 
 * @deprecated Use useSupabaseAuth() hook instead
 * Check if current user is a guest (not authenticated)
 */
export const isGuest = () => !_sessionStore?.isAuthenticated;

/** 
 * @deprecated Use useSupabaseAuth() hook instead
 * Check if current user is authenticated 
 */
export const isAuthenticated = () => _sessionStore?.isAuthenticated;