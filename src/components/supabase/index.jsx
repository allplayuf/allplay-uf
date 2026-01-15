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
  // Matches
  createMatch,
  joinMatch,
  leaveMatch,
  checkInMatch,
  getPublicMatches,
  getMatchDetails,
  getMyParticipation,
  getMatchParticipants,
  // Venues
  upsertVenue,
  getVenues,
  // Reports
  reportUser,
  getReports,
  handleReport
} from './services';

// =============================================================================
// LEGACY EXPORTS (for backwards compatibility - prefer services/* imports)
// =============================================================================
export {
  getPublicMatches as getPublicMatchesLegacy,
  getMatchDetails as getMatchDetailsRpc,
  createMatch as createMatchRpc,
  joinMatch as joinMatchRpc,
  leaveMatch as leaveMatchRpc,
  checkInMatch as checkInMatchRpc
} from './matchService';

// =============================================================================
// CONVENIENCE HELPERS
// =============================================================================
import { sessionStore as _sessionStore } from './client';

/** Check if current user is a guest (not authenticated) */
export const isGuest = () => !_sessionStore?.isAuthenticated;

/** Check if current user is authenticated */
export const isAuthenticated = () => _sessionStore?.isAuthenticated;