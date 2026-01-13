/**
 * Supabase Auth Provider for Base44
 * Provides auth context throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sessionStore, supabaseClient, AUTH_STATES } from './client';

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

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        await supabaseClient.init();
        setAuthState(sessionStore.authState);
        setUser(sessionStore.user);
        setRoles(sessionStore.roles);
      } catch (e) {
        // Auth init failed - default to guest mode (NOT an error state)
        console.log('Auth init - defaulting to guest mode');
        setAuthState(AUTH_STATES.GUEST);
      } finally {
        setIsInitialized(true);
      }
    };

    init();

    // Subscribe to session changes
    const unsubscribe = sessionStore.subscribe((state) => {
      setAuthState(state.authState);
      setUser(state.user);
      setRoles(state.roles);
    });

    return unsubscribe;
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
    supabaseClient.logout();
    setError(null);
  }, []);

  // Role check helpers
  const hasRole = useCallback((role) => {
    return roles.includes(role);
  }, [roles]);

  const isAdmin = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]);

  const isCupAdmin = useCallback(() => {
    return hasRole('cup_admin') || hasRole('admin');
  }, [hasRole]);

  const isModerator = useCallback(() => {
    return hasRole('moderator') || hasRole('admin');
  }, [hasRole]);

  // Context value
  const value = {
    // State
    authState,
    user,
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