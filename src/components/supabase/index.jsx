
/**
 * Supabase Integration Module
 * Export all Supabase-related components and utilities
 */

// Config
export { getSupabaseConfig, SUPABASE_URL, SUPABASE_FUNCTIONS_URL } from './config';

// Edge function caller
export { callEdgeFunction, callPublicEdgeFunction } from './callEdgeFunction';

// Client and session management
export { 
  supabaseClient,
  sessionStore,
  AUTH_STATES,
  initSupabase,
  login,
  logout
} from './client';

// Auth provider and hook
export { 
  SupabaseAuthProvider, 
  useSupabaseAuth,
  withAuth 
} from './AuthProvider';

// Guest guard components
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

// Login modal
export { default as LoginModal } from './LoginModal';

// Services - NEW centralized services layer
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

// Legacy exports for backwards compatibility
export {
  getPublicMatches as getPublicMatchesLegacy,
  getMatchDetails as getMatchDetailsRpc,
  createMatch as createMatchRpc,
  joinMatch as joinMatchRpc,
  leaveMatch as leaveMatchRpc,
  checkInMatch as checkInMatchRpc
} from './matchService';

// Re-export isGuest/isAuthenticated from client for convenience
export const isGuest = () => !sessionStore?.isAuthenticated;
export const isAuthenticated = () => sessionStore?.isAuthenticated;
