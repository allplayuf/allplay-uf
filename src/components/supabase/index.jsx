/**
 * Supabase Integration Module
 * Export all Supabase-related components and utilities
 */

// Client and session management
export { 
  supabaseClient,
  sessionStore,
  AUTH_STATES,
  initSupabase,
  login,
  logout,
  createMatch,
  joinMatch,
  leaveMatch,
  reportUser,
  listPublicMatches,
  getMatchDetails,
  listCups,
  getCupDetails
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