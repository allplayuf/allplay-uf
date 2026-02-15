/**
 * Supabase Auth Provider for Base44
 * 
 * ARCHITECTURE: Supabase session is source of truth
 * - Session persisted via localStorage (handled by sessionStore)
 * - Session restored automatically on page reload
 * - Subscribe to auth state changes for reactive updates
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { sessionStore, supabaseClient, AUTH_STATES } from './client';
import { primeUsers } from './services/userCache';
import { checkIsAdmin, clearAdminCache } from './services/adminService';

// Auth context
const AuthContext = createContext(null);

// Hook to use auth context
export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
}

// Auth provider component
export function SupabaseAuthProvider({ children }) {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Initialize on mount - restores session from localStorage
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        // supabaseClient.init() handles:
        // 1. Load session from localStorage
        // 2. Validate token (refresh if expired)
        // 3. Set auth state (AUTHENTICATED or GUEST)
        await supabaseClient.init();
        
        if (!isMounted) return;
        
        // Sync state from sessionStore (single source of truth)
        setAuthState(sessionStore.authState);
        setUser(sessionStore.user);
        setRoles(sessionStore.roles);
        
      } catch (e) {
        // Init failed - guest mode is valid state, not an error
        if (isMounted) {
          setAuthState(AUTH_STATES.GUEST);
        }
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    init();

    // Subscribe to session changes (login/logout/token refresh)
    const unsubscribe = sessionStore.subscribe((state) => {
      if (!isMounted) return;
      setAuthState(state.authState);
      setUser(state.user);
      setRoles(state.roles);
      
      // Prime cache with current user
      if (state.authState === AUTH_STATES.AUTHENTICATED && state.user?.id) {
        primeUsers([state.user]);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Login function - automatically syncs user to Base44
  const login = useCallback(async (email, password) => {
    setError(null);
    const result = await supabaseClient.login(email, password);
    
    if (result.error) {
      setError(result.error.message);
      return { success: false, error: result.error };
    }

    // User is now authenticated AND synced to Base44
    // They have immediate full access
    return { success: true, data: result.data };
  }, []);

  // Logout function
  const logout = useCallback(() => {
    clearAdminCache();
    supabaseClient.logout();
    setError(null);
  }, []);

  // Role check helpers
  const hasRole = useCallback((role) => {
    return roles.includes(role);
  }, [roles]);

  // Synchronous admin check from cached auth state.
  // For authoritative check, use checkIsAdmin() from adminService.
  const isAdmin = useCallback(() => {
    return user?.is_admin === true || hasRole('admin');
  }, [hasRole, user]);

  const isCupAdmin = useCallback(() => {
    return hasRole('cup_admin') || hasRole('admin');
  }, [hasRole]);

  const isModerator = useCallback(() => {
    return hasRole('moderator') || hasRole('admin');
  }, [hasRole]);

  // Enrich user with metadata for easier access
  const enrichedUser = React.useMemo(() => {
    if (!user) return null;
    
    // Supabase Auth user has user_metadata with full_name, avatar_url etc.
    const metadata = user.user_metadata || {};
    
    return {
      ...user,
      // Flatten useful metadata to top level for convenience
      full_name: user.full_name || metadata.full_name || metadata.name || user.email?.split('@')[0],
      display_name: user.display_name || metadata.display_name || metadata.full_name || metadata.name || user.email?.split('@')[0],
      profile_image_url: user.profile_image_url || metadata.avatar_url || metadata.picture,
      avatar_url: user.avatar_url || metadata.avatar_url || metadata.picture,
    };
  }, [user]);

  // Context value
  const value = {
    // State
    authState,
    user: enrichedUser, // Use enriched user with flattened metadata
    roles,
    error,
    isInitialized,
    
    // Computed
    isAuthenticated: authState === AUTH_STATES.AUTHENTICATED,
    isGuest: authState === AUTH_STATES.GUEST,
    isLoading: authState === AUTH_STATES.LOADING || !isInitialized,
    
    // Actions
    login,
    logout,
    
    // Role checks
    hasRole,
    isAdmin,
    isCupAdmin,
    isModerator,
    
    // Clear error
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// HOC for requiring auth
export function withAuth(Component, options = {}) {
  const { requireAuth = true, requiredRoles = [] } = options;

  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isGuest, isLoading, roles, hasRole } = useSupabaseAuth();

    if (isLoading) {
      return null; // Or a loading spinner
    }

    if (requireAuth && isGuest) {
      // Show login prompt or redirect
      return null;
    }

    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        return null; // Or access denied component
      }
    }

    return <Component {...props} />;
  };
}

export default SupabaseAuthProvider;