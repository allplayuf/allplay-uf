/**
 * Supabase HTTP Client for Base44
 * 
 * ARCHITECTURE: Backend is source of truth
 * - Frontend trusts Supabase RLS completely
 * - No frontend-side security filtering
 * - Session persisted via Supabase tokens
 * 
 * AUTH READY GATE:
 * - authReadyPromise resolves only after token refresh is complete
 * - All services must await waitForAuth() before making any network calls
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Session storage keys
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

/* ─── AUTH READY GATE ─── */
let _authReadyResolve = null;
let _authReady = false;

const authReadyPromise = new Promise((resolve) => {
  _authReadyResolve = resolve;
});

function markAuthReady() {
  if (!_authReady) {
    _authReady = true;
    _authReadyResolve();
  }
}

/**
 * Wait for auth initialization to complete.
 * All services MUST call this before any network request.
 */
export function waitForAuth() {
  if (_authReady) return Promise.resolve();
  return authReadyPromise;
}

/**
 * Session Store
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
      if (this._accessToken) {
        this._authState = AUTH_STATES.AUTHENTICATED;
      } else {
        this._authState = AUTH_STATES.GUEST;
      }
      this._loaded = true;
    } catch (e) {
      console.error('[SessionStore] Failed to load session:', e);
      this.clear();
    }
  }

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
    } catch (e) {
      console.error('[SessionStore] Failed to save session:', e);
    }
    this._notifyListeners();
  }

  clear() {
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

  setTokens(accessToken, refreshToken, expiresIn = 3600) {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
    this._tokenExpiry = Date.now() + (expiresIn * 1000);
    this.save();
  }

  isTokenExpired() {
    if (!this._tokenExpiry) return true;
    // Expired or within 60 seconds of expiry
    return Date.now() > (Number(this._tokenExpiry) - 60 * 1000);
  }

  setUser(user) { this._user = user; this.save(); }
  setRoles(roles) { this._roles = Array.isArray(roles) ? roles : []; this.save(); }
  setAuthState(state) { this._authState = state; this.save(); }

  get accessToken() { return this._accessToken; }
  get refreshToken() { return this._refreshToken; }
  get user() { return this._user; }
  get roles() { return this._roles; }
  get authState() { return this._authState; }
  get isAuthenticated() { return this._authState === AUTH_STATES.AUTHENTICATED; }
  get isGuest() { return this._authState === AUTH_STATES.GUEST; }

  hasRole(role) { return this._roles.includes(role); }
  isAdmin() { return this.hasRole('admin'); }
  isCupAdmin() { return this.hasRole('cup_admin') || this.hasRole('admin'); }
  isModerator() { return this.hasRole('moderator') || this.hasRole('admin'); }

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
      } catch (e) { /* ignore */ }
    });
  }
}

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

    // Load persisted session
    sessionStore.load();

    // Config is hardcoded — no async fetch needed
    this._config = { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
    console.log('[SupabaseClient] Config loaded, anonKey:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.slice(0, 8)}... (${SUPABASE_ANON_KEY.length} chars)` : 'MISSING');

    // Handle token refresh BEFORE marking auth ready
    if (sessionStore.accessToken) {
      if (sessionStore.isTokenExpired() && sessionStore.refreshToken) {
        // Token expired → refresh first
        const refreshed = await this.refreshSession();
        if (!refreshed) {
          sessionStore.clear();
        }
      } else if (!sessionStore.isTokenExpired()) {
        // Token looks valid, validate it
        try {
          const valid = await this.validateSession();
          if (!valid && sessionStore.refreshToken) {
            const refreshed = await this.refreshSession();
            if (!refreshed) sessionStore.clear();
          } else if (!valid) {
            sessionStore.clear();
          }
        } catch (e) {
          if (sessionStore.refreshToken) {
            const refreshed = await this.refreshSession();
            if (!refreshed) sessionStore.clear();
          } else {
            sessionStore.clear();
          }
        }
      } else {
        // Expired and no refresh token
        sessionStore.clear();
      }
    } else {
      sessionStore.setAuthState(AUTH_STATES.GUEST);
    }

    this._initialized = true;

    // CRITICAL: Mark auth ready AFTER token is valid
    markAuthReady();
    console.log('[SupabaseClient] Auth ready, state:', sessionStore.authState);
  }

  async refreshSession() {
    if (!sessionStore.refreshToken) return false;
    try {
      const result = await this._fetch('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        includeAuth: false,
        body: JSON.stringify({ refresh_token: sessionStore.refreshToken })
      });
      if (result.error || !result.data?.access_token) return false;
      const { access_token, refresh_token, expires_in, user } = result.data;
      sessionStore.setTokens(access_token, refresh_token, expires_in || 3600);
      if (user) sessionStore.setUser(user);
      sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);
      return true;
    } catch (e) {
      console.error('[SupabaseClient] Token refresh error:', e);
      return false;
    }
  }

  _getHeaders(includeAuth = true) {
    // No async needed — SUPABASE_ANON_KEY is a hardcoded constant import
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    };
    if (includeAuth && sessionStore.accessToken) {
      headers['Authorization'] = `Bearer ${sessionStore.accessToken}`;
    }
    // Debug for iOS
    console.log('[SupabaseClient._getHeaders]', {
      apikey: SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.slice(0, 8)}...(${SUPABASE_ANON_KEY.length})` : 'MISSING',
      auth: headers['Authorization'] ? 'present' : 'absent'
    });
    return headers;
  }

  async _fetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${SUPABASE_URL}${endpoint}`;
    try {
      const headers = this._getHeaders(options.includeAuth !== false);
      const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 && endpoint.includes('/auth/')) {
          // Only clear session for Supabase auth endpoints, not REST API 401s
          sessionStore.clear();
          return { error: { code: 401, message: 'Session expired. Please login again.' } };
        }
        return { error: { code: response.status, message: data.error_description || data.message || data.msg || data.error || 'Server error.' } };
      }
      return { data };
    } catch (e) {
      return { error: { code: 0, message: `Network error: ${e.message || 'CORS/fetch blocked'}` } };
    }
  }

  async login(email, password) {
    const result = await this._fetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ email, password })
    });
    if (result.error) return result;
    const { access_token, refresh_token, expires_in, user } = result.data;
    sessionStore.setTokens(access_token, refresh_token, expires_in || 3600);
    sessionStore.setUser(user);
    sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);

    // Mark auth ready if login happens after init
    markAuthReady();

    // Sync full_name from auth metadata to public.users (in case it's missing)
    this.syncUserToPublicProfile(user).catch(() => {});

    await this.fetchUserRoles();
    return { data: { user: sessionStore.user, roles: sessionStore.roles } };
  }

  logout() {
    import('./services/adminService').then(m => m.clearAdminCache()).catch(() => {});
    sessionStore.clear();
    return { data: { ok: true } };
  }

  async validateSession() {
    if (!sessionStore.accessToken) return false;
    const result = await this._fetch('/functions/v1/me', { method: 'POST' });
    if (result.error || !result.data?.ok) return false;
    const userData = result.data.user || sessionStore.user || null;
    const roles = Array.isArray(result.data.roles) ? result.data.roles : [];
    sessionStore.setUser(userData);
    sessionStore.setRoles(roles);
    sessionStore.setAuthState(AUTH_STATES.AUTHENTICATED);
    // Session validated via Supabase only — no Base44 sync
    return true;
  }

  async fetchUserRoles() {
    const result = await this._fetch('/functions/v1/me', { method: 'POST' });
    if (result.data?.ok) {
      const roles = Array.isArray(result.data.roles) ? result.data.roles : [];
      sessionStore.setRoles(roles);
    }
    return result;
  }

  async syncUserToPublicProfile(authUser) {
    if (!authUser?.id) return;
    
    // Try multiple sources for full_name
    let fullName = authUser.user_metadata?.full_name 
                || authUser.raw_user_meta_data?.full_name 
                || null;
    
    // Fallback: check localStorage (set during signup when email verification is required)
    if (!fullName) {
      try {
        const pendingName = localStorage.getItem('allplay_pending_fullname');
        if (pendingName) {
          fullName = pendingName;
          localStorage.removeItem('allplay_pending_fullname');
        }
      } catch (e) { /* ignore */ }
    }
    
    const email = authUser.email || null;
    
    if (!fullName && !email) return;
    
    try {
      const headers = this._getHeaders(true);
      headers['Prefer'] = 'resolution=merge-duplicates';
      
      const body = { id: authUser.id };
      if (fullName) {
        body.full_name = fullName;
        body.display_name = fullName;
      }
      if (email) body.email = email;
      
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${authUser.id}`,
        { method: 'PATCH', headers, body: JSON.stringify(body) }
      );
      
      if (!res.ok) {
        console.warn('[SupabaseClient] syncUserToPublicProfile PATCH failed:', res.status);
        if (res.status === 404 || res.status === 406) {
          body.username = email ? email.split('@')[0] : authUser.id.slice(0, 8);
          await fetch(
            `${SUPABASE_URL}/rest/v1/users`,
            {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
              body: JSON.stringify(body)
            }
          );
        }
      } else {
        console.log('[SupabaseClient] syncUserToPublicProfile OK for', authUser.id, fullName);
      }
    } catch (e) {
      console.warn('[SupabaseClient] syncUserToPublicProfile error:', e.message);
    }
  }
}

export const supabaseClient = new SupabaseClient();
export const initSupabase = () => supabaseClient.init();
export const login = (email, password) => supabaseClient.login(email, password);
export const logout = () => supabaseClient.logout();