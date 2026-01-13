/**
 * Supabase HTTP Client for Base44
 * 
 * SECURITY: Only uses SUPABASE_URL + SUPABASE_ANON_KEY
 * NEVER uses service role key
 * All writes go through Edge Functions
 */

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';

// Get anon key from environment/secrets
const getAnonKey = async () => {
  // In production, this would come from Base44 secrets
  // For now, we'll use a placeholder that gets replaced
  try {
    const { base44 } = await import('@/api/base44Client');
    // Try to get from a backend function that has access to secrets
    const response = await base44.functions.invoke('getSupabaseConfig');
    return response?.data?.anonKey || null;
  } catch (e) {
    console.error('Failed to get Supabase config:', e);
    return null;
  }
};

// Session storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'supabase_access_token',
  REFRESH_TOKEN: 'supabase_refresh_token',
  USER: 'supabase_user',
  ROLES: 'supabase_roles',
  AUTH_STATE: 'supabase_auth_state'
};

// Auth states
export const AUTH_STATES = {
  GUEST: 'guest',
  AUTHENTICATED: 'authenticated',
  LOADING: 'loading'
};

/**
 * Session Store - manages tokens and user data
 */
class SessionStore {
  constructor() {
    this._accessToken = null;
    this._refreshToken = null;
    this._user = null;
    this._roles = [];
    this._authState = AUTH_STATES.LOADING;
    this._listeners = new Set();
  }

  // Load from localStorage on init
  load() {
    try {
      this._accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      this._refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      this._user = userStr ? JSON.parse(userStr) : null;
      const rolesStr = localStorage.getItem(STORAGE_KEYS.ROLES);
      this._roles = rolesStr ? JSON.parse(rolesStr) : [];
      this._authState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE) || AUTH_STATES.GUEST;
    } catch (e) {
      console.error('Failed to load session:', e);
      this.clear();
    }
  }

  // Save to localStorage
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
      if (this._user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this._user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(this._roles));
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, this._authState);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
    this._notifyListeners();
  }

  // Clear all session data
  clear() {
    this._accessToken = null;
    this._refreshToken = null;
    this._user = null;
    this._roles = [];
    this._authState = AUTH_STATES.GUEST;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this._notifyListeners();
  }

  // Setters
  setTokens(accessToken, refreshToken) {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
    this.save();
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
    this._anonKey = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    
    sessionStore.load();
    
    // Get anon key
    this._anonKey = await getAnonKey();
    
    // Validate existing session if we have a token
    if (sessionStore.accessToken) {
      const isValid = await this.validateSession();
      if (!isValid) {
        sessionStore.clear();
      }
    } else {
      sessionStore.setAuthState(AUTH_STATES.GUEST);
    }
    
    this._initialized = true;
  }

  // Get headers for API calls
  _getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this._anonKey) {
      headers['apikey'] = this._anonKey;
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
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this._getHeaders(options.includeAuth !== false),
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

    const { access_token, refresh_token, user } = result.data;
    
    // Store tokens
    sessionStore.setTokens(access_token, refresh_token);
    sessionStore.setUser(user);
    sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);

    // Fetch roles from /me endpoint
    await this.fetchUserRoles();

    return { data: { user: sessionStore.user, roles: sessionStore.roles } };
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

    sessionStore.setUser(result.data.user);
    sessionStore.setRoles(result.data.roles || []);
    sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);
    
    return true;
  }

  // Fetch user roles from /me endpoint
  async fetchUserRoles() {
    const result = await this._fetch('/functions/v1/me', {
      method: 'POST'
    });

    if (result.data?.ok) {
      sessionStore.setRoles(result.data.roles || []);
    }

    return result;
  }

  /**
   * EDGE FUNCTION CALLS (Protected Operations)
   */

  // Create match
  async createMatch(matchData) {
    if (sessionStore.isGuest) {
      return { error: { code: 401, message: 'You must be logged in to create a match.' } };
    }

    return this._fetch('/functions/v1/create_match', {
      method: 'POST',
      body: JSON.stringify(matchData)
    });
  }

  // Join match
  async joinMatch(matchId) {
    if (sessionStore.isGuest) {
      return { error: { code: 401, message: 'You must be logged in to join a match.' } };
    }

    return this._fetch('/functions/v1/join_match', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId })
    });
  }

  // Leave match
  async leaveMatch(matchId) {
    if (sessionStore.isGuest) {
      return { error: { code: 401, message: 'You must be logged in to leave a match.' } };
    }

    return this._fetch('/functions/v1/leave_match', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId })
    });
  }

  // Report user
  async reportUser(reportData) {
    if (sessionStore.isGuest) {
      return { error: { code: 401, message: 'You must be logged in to report a user.' } };
    }

    return this._fetch('/functions/v1/report_user', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  /**
   * READ ENDPOINTS (Some allow guest access)
   */

  // List public matches (guest allowed)
  async listPublicMatches(filters = {}) {
    return this._fetch('/functions/v1/list_public_matches', {
      method: 'POST',
      includeAuth: sessionStore.isAuthenticated,
      body: JSON.stringify(filters)
    });
  }

  // Get match details (guest allowed with reduced fields)
  async getMatchDetails(matchId) {
    return this._fetch('/functions/v1/get_match_details', {
      method: 'POST',
      includeAuth: sessionStore.isAuthenticated,
      body: JSON.stringify({ match_id: matchId })
    });
  }

  // List cups (guest allowed)
  async listCups(filters = {}) {
    return this._fetch('/functions/v1/list_cups', {
      method: 'POST',
      includeAuth: sessionStore.isAuthenticated,
      body: JSON.stringify(filters)
    });
  }

  // Get cup details (guest allowed)
  async getCupDetails(cupId) {
    return this._fetch('/functions/v1/get_cup_details', {
      method: 'POST',
      includeAuth: sessionStore.isAuthenticated,
      body: JSON.stringify({ cup_id: cupId })
    });
  }

  /**
   * ADMIN ENDPOINTS (Role-protected)
   */

  // Get reports (admin/moderator only)
  async getReports(filters = {}) {
    if (!sessionStore.isAdmin() && !sessionStore.isModerator()) {
      return { error: { code: 403, message: 'Admin access required.' } };
    }

    return this._fetch('/functions/v1/get_reports', {
      method: 'POST',
      body: JSON.stringify(filters)
    });
  }

  // Handle report (admin/moderator only)
  async handleReport(reportId, action, notes) {
    if (!sessionStore.isAdmin() && !sessionStore.isModerator()) {
      return { error: { code: 403, message: 'Admin access required.' } };
    }

    return this._fetch('/functions/v1/handle_report', {
      method: 'POST',
      body: JSON.stringify({ report_id: reportId, action, notes })
    });
  }
}

// Singleton client
export const supabaseClient = new SupabaseClient();

// Export convenience functions
export const initSupabase = () => supabaseClient.init();
export const login = (email, password) => supabaseClient.login(email, password);
export const logout = () => supabaseClient.logout();
export const createMatch = (data) => supabaseClient.createMatch(data);
export const joinMatch = (matchId) => supabaseClient.joinMatch(matchId);
export const leaveMatch = (matchId) => supabaseClient.leaveMatch(matchId);
export const reportUser = (data) => supabaseClient.reportUser(data);
export const listPublicMatches = (filters) => supabaseClient.listPublicMatches(filters);
export const getMatchDetails = (matchId) => supabaseClient.getMatchDetails(matchId);
export const listCups = (filters) => supabaseClient.listCups(filters);
export const getCupDetails = (cupId) => supabaseClient.getCupDetails(cupId);