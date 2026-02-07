/**
 * Supabase HTTP Client for Base44
 * 
 * ARCHITECTURE: Backend is source of truth
 * - Frontend trusts Supabase RLS completely
 * - No frontend-side security filtering
 * - Session persisted via Supabase tokens
 * 
 * SECURITY:
 * - Only uses SUPABASE_URL + SUPABASE_ANON_KEY
 * - NEVER uses service role key
 * - All writes go through Edge Functions (RLS enforced)
 */

import { getSupabaseConfig, SUPABASE_URL } from './config';

// Session storage keys - prefixed to avoid collisions
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'allplay_supabase_access_token',
  REFRESH_TOKEN: 'allplay_supabase_refresh_token',
  USER: 'allplay_supabase_user',
  ROLES: 'allplay_supabase_roles',
  AUTH_STATE: 'allplay_supabase_auth_state',
  TOKEN_EXPIRY: 'allplay_supabase_token_expiry'
};

// Auth states
export const AUTH_STATES = {
  GUEST: 'guest',
  AUTHENTICATED: 'authenticated',
  LOADING: 'loading'
};

/**
 * Session Store - manages tokens and user data
 * Persists to localStorage for session survival across page reloads
 */
class SessionStore {
  constructor() {
    this._accessToken = null;
    this._refreshToken = null;
    this._tokenExpiry = null;
    this._user = null;
    this._roles = [];
    this._authState = AUTH_STATES.LOADING;
    this._listeners = new Set();
    this._loaded = false;
  }

  // Load from localStorage on init
  load() {
    if (this._loaded) return;
    
    try {
      this._accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      this._refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      this._tokenExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      this._user = userStr ? JSON.parse(userStr) : null;
      
      const rolesStr = localStorage.getItem(STORAGE_KEYS.ROLES);
      this._roles = rolesStr ? JSON.parse(rolesStr) : [];
      
      // If we have a token, assume authenticated until validated
      if (this._accessToken) {
        this._authState = AUTH_STATES.AUTHENTICATED;
        console.log('[SessionStore] Loaded session from storage');
      } else {
        this._authState = AUTH_STATES.GUEST;
      }
      
      this._loaded = true;
    } catch (e) {
      console.error('[SessionStore] Failed to load session:', e);
      this.clear();
    }
  }

  // Save to localStorage - ALWAYS persist for session survival
  save() {
    try {
      if (this._accessToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, this._accessToken);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      }
      if (this._refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, this._refreshToken);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
      if (this._tokenExpiry) {
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, this._tokenExpiry);
      } else {
        localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      }
      if (this._user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this._user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(this._roles));
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, this._authState);
      
      console.log('[SessionStore] Session saved, authState:', this._authState);
    } catch (e) {
      console.error('[SessionStore] Failed to save session:', e);
    }
    this._notifyListeners();
  }

  // Clear all session data (logout)
  clear() {
    console.log('[SessionStore] Clearing session');
    this._accessToken = null;
    this._refreshToken = null;
    this._tokenExpiry = null;
    this._user = null;
    this._roles = [];
    this._authState = AUTH_STATES.GUEST;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    });
    
    this._notifyListeners();
  }

  // Setters
  setTokens(accessToken, refreshToken, expiresIn = 3600) {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
    // Calculate expiry time (default 1 hour)
    this._tokenExpiry = Date.now() + (expiresIn * 1000);
    this.save();
  }
  
  // Check if token is expired or about to expire (within 5 min)
  isTokenExpired() {
    if (!this._tokenExpiry) return true;
    return Date.now() > (this._tokenExpiry - 5 * 60 * 1000);
  }

  setUser(user) {
    this._user = user;
    this.save();
  }

  setRoles(roles) {
    this._roles = Array.isArray(roles) ? roles : [];
    this.save();
  }

  setAuthState(state) {
    this._authState = state;
    this.save();
  }

  // Getters
  get accessToken() { return this._accessToken; }
  get refreshToken() { return this._refreshToken; }
  get user() { return this._user; }
  get roles() { return this._roles; }
  get authState() { return this._authState; }
  get isAuthenticated() { return this._authState === AUTH_STATES.AUTHENTICATED; }
  get isGuest() { return this._authState === AUTH_STATES.GUEST; }

  // Role checks
  hasRole(role) {
    return this._roles.includes(role);
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  isCupAdmin() {
    return this.hasRole('cup_admin') || this.hasRole('admin');
  }

  isModerator() {
    return this.hasRole('moderator') || this.hasRole('admin');
  }

  // Subscribe to changes
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners() {
    this._listeners.forEach(listener => {
      try {
        listener({
          user: this._user,
          roles: this._roles,
          authState: this._authState,
          isAuthenticated: this.isAuthenticated,
          isGuest: this.isGuest
        });
      } catch (e) {
        console.error('Session listener error:', e);
      }
    });
  }
}

// Singleton session store
export const sessionStore = new SessionStore();

/**
 * Supabase HTTP Client
 */
class SupabaseClient {
  constructor() {
    this._config = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    
    console.log('[SupabaseClient] Initializing...');
    
    // Load persisted session from localStorage
    sessionStore.load();
    
    // Get config (non-blocking - guest mode still works without it)
    try {
      this._config = await getSupabaseConfig();
    } catch (e) {
      console.log('[SupabaseClient] Failed to get config, continuing in guest mode');
    }
    
    // Restore session if we have tokens
    if (sessionStore.accessToken) {
      console.log('[SupabaseClient] Found existing token, validating...');
      
      // Check if token needs refresh
      if (sessionStore.isTokenExpired() && sessionStore.refreshToken) {
        console.log('[SupabaseClient] Token expired, attempting refresh...');
        const refreshed = await this.refreshSession();
        if (!refreshed) {
          console.log('[SupabaseClient] Refresh failed, clearing session');
          sessionStore.clear();
        }
      } else {
        // Token not expired, validate it
        try {
          const isValid = await this.validateSession();
          if (!isValid) {
            // Try refresh before giving up
            if (sessionStore.refreshToken) {
              const refreshed = await this.refreshSession();
              if (!refreshed) {
                sessionStore.clear();
              }
            } else {
              sessionStore.clear();
            }
          } else {
            console.log('[SupabaseClient] Session validated successfully');
          }
        } catch (e) {
          console.log('[SupabaseClient] Session validation failed:', e.message);
          // Try refresh before giving up
          if (sessionStore.refreshToken) {
            const refreshed = await this.refreshSession();
            if (!refreshed) {
              sessionStore.clear();
            }
          } else {
            sessionStore.clear();
          }
        }
      }
    } else {
      // No token - default to guest mode (this is normal, NOT an error)
      console.log('[SupabaseClient] No token found, guest mode');
      sessionStore.setAuthState(AUTH_STATES.GUEST);
    }
    
    this._initialized = true;
    console.log('[SupabaseClient] Initialized, authState:', sessionStore.authState);
  }

  // Refresh the access token using refresh token
  async refreshSession() {
    if (!sessionStore.refreshToken) {
      return false;
    }
    
    try {
      const result = await this._fetch('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        includeAuth: false,
        body: JSON.stringify({ refresh_token: sessionStore.refreshToken })
      });

      if (result.error || !result.data?.access_token) {
        console.log('[SupabaseClient] Token refresh failed:', result.error?.message);
        return false;
      }

      const { access_token, refresh_token, expires_in, user } = result.data;
      
      // Update tokens
      sessionStore.setTokens(access_token, refresh_token, expires_in || 3600);
      if (user) {
        sessionStore.setUser(user);
      }
      sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);
      
      console.log('[SupabaseClient] Token refreshed successfully');
      return true;
    } catch (e) {
      console.error('[SupabaseClient] Token refresh error:', e);
      return false;
    }
  }

  // Get headers for API calls
  async _getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Ensure config is loaded
    if (!this._config) {
      this._config = await getSupabaseConfig();
    }
    
    if (this._config?.anonKey) {
      headers['apikey'] = this._config.anonKey;
    }
    
    if (includeAuth && sessionStore.accessToken) {
      headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
    }
    
    return headers;
  }

  // Generic fetch wrapper with error handling
  async _fetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${SUPABASE_URL}${endpoint}`;
    
    try {
      const headers = await this._getHeaders(options.includeAuth !== false);
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          sessionStore.clear();
          return { error: { code: 401, message: 'Session expired. Please login again.' } };
        }
        if (response.status === 403) {
          return { error: { code: 403, message: 'You do not have permission to perform this action.' } };
        }
        if (response.status === 400) {
          return { error: { code: 400, message: data.message || data.error || 'Invalid request.' } };
        }
        return { error: { code: response.status, message: data.message || data.error || 'Server error.' } };
      }

      return { data };
    } catch (e) {
      console.error('Fetch error:', e);
      return { error: { code: 500, message: 'Network error. Please check your connection.' } };
    }
  }

  /**
   * AUTH METHODS
   */

  // Login with email/password
  async login(email, password) {
    const result = await this._fetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ email, password })
    });

    if (result.error) {
      return result;
    }

    const { access_token, refresh_token, expires_in, user } = result.data;
    
    // Store tokens with expiry
    sessionStore.setTokens(access_token, refresh_token, expires_in || 3600);
    sessionStore.setUser(user);
    sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);
    
    console.log('[SupabaseClient] Login successful, session persisted');

    // CRITICAL: Sync Supabase user to Base44 User entity
    // This ensures every authenticated user has a corresponding app user record
    await this.syncUserToBase44(user);

    // Fetch roles from /me endpoint
    await this.fetchUserRoles();

    return { data: { user: sessionStore.user, roles: sessionStore.roles } };
  }

  // Sync Supabase Auth user to Base44 User entity
  // Idempotent - safe to call multiple times
  async syncUserToBase44(supabaseUser) {
    if (!supabaseUser?.id || !supabaseUser?.email) {
      console.log('[syncUserToBase44] Missing user data, skipping sync');
      return;
    }

    try {
      const { base44 } = await import('@/api/base44Client');
      
      const result = await base44.functions.invoke('auth/syncUser', {
        supabase_user_id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        provider: supabaseUser.app_metadata?.provider || 'email'
      });

      if (result?.data?.ok) {
        console.log('[syncUserToBase44] User synced successfully:', result.data.created ? 'created' : 'existing');
      } else {
        console.warn('[syncUserToBase44] Sync returned non-ok:', result?.data);
      }
    } catch (error) {
      // Log but don't block - user is authenticated in Supabase
      console.error('[syncUserToBase44] Error syncing user (non-blocking):', error);
    }
  }

  // Logout
  logout() {
    sessionStore.clear();
    return { data: { ok: true } };
  }

  // Validate session by calling /me
  async validateSession() {
    if (!sessionStore.accessToken) {
      return false;
    }

    const result = await this._fetch('/functions/v1/me', {
      method: 'POST'
    });

    if (result.error || !result.data?.ok) {
      return false;
    }

    // ROBUST: Handle missing user data
    const userData = result.data.user || sessionStore.user || null;
    const roles = Array.isArray(result.data.roles) ? result.data.roles : [];
    
    sessionStore.setUser(userData);
    sessionStore.setRoles(roles);
    sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);
    
    // Sync user to Base44 on session validation too (handles returning users)
    if (userData) {
      await this.syncUserToBase44(userData);
    }
    
    return true;
  }

  // Fetch user roles from /me endpoint
  async fetchUserRoles() {
    const result = await this._fetch('/functions/v1/me', {
      method: 'POST'
    });

    if (result.data?.ok) {
      const roles = Array.isArray(result.data.roles) ? result.data.roles : [];
      sessionStore.setRoles(roles);
    }

    return result;
  }

  /**
   * REMOVED: All domain-specific methods (createMatch, joinMatch, etc.)
   * 
   * ARCHITECTURE: Use services/* instead
   * - matchesService.js for match operations
   * - reportsService.js for report operations
   * - venuesService.js for venue operations
   * 
   * This client only handles:
   * - Session management (login/logout/refresh)
   * - Low-level fetch with auth headers
   * 
   * Backend RLS handles all authorization - no frontend guards needed.
   */
}

// Singleton client
export const supabaseClient = new SupabaseClient();

// Export only auth-related convenience functions
// All domain operations should use services/* instead
export const initSupabase = () => supabaseClient.init();
export const login = (email, password) => supabaseClient.login(email, password);
export const logout = () => supabaseClient.logout();