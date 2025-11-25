import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialize Supabase to avoid crashing at module import time if envs are missing.
let _client: SupabaseClient | null = null;

function readPublicEnv() {
  const url = typeof import.meta !== 'undefined' ? (import.meta.env?.PUBLIC_SUPABASE_URL as string) : process.env.PUBLIC_SUPABASE_URL;
  const anon = typeof import.meta !== 'undefined' ? (import.meta.env?.PUBLIC_SUPABASE_ANON as string) : process.env.PUBLIC_SUPABASE_ANON;
  return { url: url || '', anon: anon || '' };
}

function getClient(): SupabaseClient {
  if (_client) return _client;
  const { url, anon } = readPublicEnv();
  if (!url || !anon) {
    throw new Error('Supabase client not configured: PUBLIC_SUPABASE_URL and/or PUBLIC_SUPABASE_ANON are missing');
  }
  _client = createClient(url, anon);
  return _client;
}

// Proxy that forwards property access to the real client once initialized
const supabase: any = new Proxy({}, {
  get(_target, prop) {
    const c: any = getClient();
    return c[prop as any];
  },
  set(_target, prop, value) {
    const c: any = getClient();
    c[prop as any] = value;
    return true;
  }
});

// Export the supabase client as a named export for use in other modules
export { supabase };

// Provide an `account`-like object with minimal helpers used by the app
export const account = {
  // createJWT used by Workers endpoint in onboarding/profile
  async createJWT() {
    // Supabase does not provide a direct JWT creation via client SDK.
    // Instead, return the user's access token if available.
  const s = (getClient().auth as any).getSession ? await (getClient().auth as any).getSession() : await (getClient().auth as any).session();
    const token = (s as any)?.data?.session?.access_token || (s as any)?.access_token || null;
    if (!token) throw new Error('No session token available');
    return { jwt: token };
  },
  // Fallbacks for other direct account calls
  async get() {
    try {
  const maybe = await getClient().auth.getUser();
      console.debug('supabase.auth.getUser raw result', maybe);
  let user = (maybe && (maybe as any).data && (maybe as any).data.user) ? (maybe as any).data.user : null;
      // Fallback: try getSession and return session.user
      if (!user && typeof (supabase.auth as any).getSession === 'function') {
        try {
          const s = await (supabase.auth as any).getSession();
          console.debug('supabase.getSession fallback result', s);
          const su = (s && (s as any).data && (s as any).data.session && (s as any).data.session.user) ? (s as any).data.session.user : null;
          user = su;
          // fall through to normalize below
        } catch (e) {
          console.debug('supabase.getSession fallback failed', e);
        }
      }
      if (user) {
        // Normalize common fields for compatibility with Appwrite-shaped user
        const meta = user.user_metadata || (user.user_metadata === undefined ? {} : {});
        if (!user.name && meta && meta.name) user.name = meta.name;
        // prefs might be nested in metadata as 'prefs' or 'preferences'
        const prefs = meta.prefs || meta.preferences || (user.prefs || user.preferences) || null;
        if (!user.prefs && prefs) user.prefs = prefs;
      }
      return user;
    } catch (e) {
      console.error('supabase account.get failed', e);
      return null;
    }
  },
  // createMagicURLSession -> supabase.auth.signInWithOtp
  async createMagicURLSession(email: string, redirectTo?: string) {
    try {
      // Default redirect to our verify handler if not provided
      if (!redirectTo && typeof window !== 'undefined') {
        redirectTo = `${window.location.origin}/account/verify`;
      }

      console.debug('createMagicURLSession using redirectTo=', redirectTo);

      const resp: any = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      // Helpful debug information for local development
      console.debug('supabase.signInWithOtp response for', email, resp);
      if (resp.error) {
        console.error('signInWithOtp error', resp.error);
        // Provide friendlier error message for signup restrictions
        if (resp.error.message?.includes('Signups not allowed')) {
          throw new Error('This is an invite-only beta. Please contact us if you\'d like access.');
        }
        throw resp.error;
      }
      return resp;
    } catch (err) {
      console.error('createMagicURLSession failed', err);
      throw err;
    }
  },
  // delete session / logout
  async deleteSession() {
  await getClient().auth.signOut();
    return true;
  }
};

// Helper functions mirroring the Appwrite wrapper surface
export const createMagicURLSession = async (email: string) => {
  return await account.createMagicURLSession(email);
};

export const updateMagicURLSession = async (userId?: string, secret?: string) => {
  try {
    console.debug('[updateMagicURLSession] Starting session verification...', { userId: userId ? 'provided' : 'none', secret: secret ? 'provided' : 'none' });
    
    // Supabase completes sessions from the redirect URL
    // v2: getSessionFromUrl; v1 fallback handled by getSession
    const auth: any = (getClient().auth as any);
    
    if (typeof auth.getSessionFromUrl === 'function') {
      try {
        console.debug('[updateMagicURLSession] Using getSessionFromUrl method');
        const res: any = await auth.getSessionFromUrl({ storeSession: true });
        console.debug('[updateMagicURLSession] getSessionFromUrl result:', { 
          hasError: !!res.error, 
          hasSession: !!res.data?.session,
          hasUser: !!res.data?.session?.user 
        });
        
        if (res.error) {
          console.error('[updateMagicURLSession] getSessionFromUrl returned error:', res.error);
          throw res.error;
        }
        
        if (res.data?.session?.user) {
          console.debug('[updateMagicURLSession] Session successfully established for user:', res.data.session.user.email);
        }
        
        return res;
      } catch (err) {
        console.error('[updateMagicURLSession] getSessionFromUrl failed:', err);
        throw err;
      }
    }

    // Older SDKs may expose getSession
    if (typeof auth.getSession === 'function') {
      try {
        console.debug('[updateMagicURLSession] Using getSession method (fallback)');
        const res: any = await auth.getSession();
        console.debug('[updateMagicURLSession] getSession result:', { 
          hasError: !!res.error, 
          hasSession: !!res.data?.session,
          hasUser: !!res.data?.session?.user 
        });
        
        if (res.data?.session?.user) {
          console.debug('[updateMagicURLSession] Session successfully established for user:', res.data.session.user.email);
        }
        
        return res;
      } catch (err) {
        console.error('[updateMagicURLSession] getSession failed:', err);
        throw err;
      }
    }

    console.error('[updateMagicURLSession] No suitable session method available on Supabase client');
    throw new Error('Supabase SDK does not support completing magic-link sessions in this environment');
  } catch (e) {
    console.error('[updateMagicURLSession] Unexpected error:', e);
    throw e;
  }
};

export const getCurrentUser = async () => {
  try {
    // For static sites, check localStorage tokens and parse real user data
    if (typeof window !== "undefined") {
      let authToken = null;
      let tokenKey = null;
      
      console.debug('[getCurrentUser] Checking localStorage for auth tokens...');
      console.debug('[getCurrentUser] localStorage.length:', localStorage.length);
      
      // Log all localStorage keys for debugging (only in detailed mode)
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) allKeys.push(k);
      }
      console.debug('[getCurrentUser] All keys:', allKeys);
      
      // Find the Supabase auth token
      if ("localStorage" in window) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && /^sb-.*-auth-token$/.test(k)) {
            const v = localStorage.getItem(k);
            if (v && v !== "null" && v !== "undefined") {
              authToken = v;
              tokenKey = k;
              console.debug('[getCurrentUser] Found matching auth token key:', k);
              break;
            }
          }
        }
      }
      
      if (authToken) {
        try {
          console.debug('[getCurrentUser] Attempting to parse auth token from key:', tokenKey);
          // Parse the actual Supabase session data
          const sessionData = JSON.parse(authToken);
          console.debug('[getCurrentUser] Parsed session data structure keys:', Object.keys(sessionData));
          
          // Extract user from session data (Supabase format)
          const user = sessionData?.user || sessionData?.data?.user || sessionData?.session?.user;
          if (user) {
            console.debug('[getCurrentUser] Found user:', { id: user.id, email: user.email });
            
            // Extract name and preferences from user_metadata and add as direct properties
            const userName = user.user_metadata?.name || null;
            const userPrefs = user.user_metadata?.prefs || null;
            console.debug('[getCurrentUser] User metadata - name:', userName, 'prefs:', userPrefs ? Object.keys(userPrefs) : null);
            
            return {
              ...user,
              name: userName, // Add name property for easier access
              prefs: userPrefs // Add prefs property for easier access
            };
          } else {
            console.warn('[getCurrentUser] No user found in session data. Available keys:', Object.keys(sessionData));
            console.debug('[getCurrentUser] Full session data:', sessionData);
          }
        } catch (parseError) {
          console.error('[getCurrentUser] Failed to parse auth token:', parseError);
          console.debug('[getCurrentUser] Raw token preview:', authToken.substring(0, 200) + '...');
        }
      } else {
        console.warn('[getCurrentUser] No matching auth token found in localStorage');
      }
      
      return null;
    }
    
    // Fallback to real Supabase auth if in a server environment
    console.debug('[getCurrentUser] Not in browser context, using Supabase client directly');
    const u = await account.get();
    console.debug('[getCurrentUser] Supabase client returned:', u ? { id: u.id, email: u.email } : null);
    return u;
  } catch (e) {
    console.error('[getCurrentUser] Unexpected error:', e);
    return null;
  }
};

export const updateAccountName = async (name: string) => {
  // Read current user, support both v2 getUser() and v1 user()
  const auth: any = (getClient().auth as any);
  const maybe = auth.getUser ? (await auth.getUser()) : (await auth.user());
  const user = (maybe && (maybe as any).data && (maybe as any).data.user) ? (maybe as any).data.user : (maybe && (maybe as any).user) ? (maybe as any).user : null;
  if (!user) throw new Error('Not authenticated');

  console.debug('updateAccountName: current user before update', user);
  // Supabase v2: updateUser({ data: { ... } }) updates user metadata
  const payload = { data: { ...(user.user_metadata || {}), name } };
  const resp: any = auth.updateUser ? await auth.updateUser(payload) : await auth.update(payload);
  console.debug('updateAccountName response', resp);
  if (resp && resp.error) throw resp.error;
  return true;
};

export const updateAccountPreference = async (key: string, value: any) => {
  const auth2: any = (getClient().auth as any);
  const maybe = auth2.getUser ? (await auth2.getUser()) : (await auth2.user());
  const user = (maybe && (maybe as any).data && (maybe as any).data.user) ? (maybe as any).data.user : (maybe && (maybe as any).user) ? (maybe as any).user : null;
  if (!user) throw new Error('Not authenticated');
  const metadata = { ...(user.user_metadata || {}) };
  metadata.prefs = { ...(metadata.prefs || {}), [key]: value };
  const payload = { data: metadata };
  console.debug('updateAccountPreference payload', payload);
  const resp: any = auth2.updateUser ? await auth2.updateUser(payload) : await auth2.update(payload);
  console.debug('updateAccountPreference response', resp);
  if (resp && resp.error) throw resp.error;
  return true;
};

// Upsert a user profile row into a `profiles` table (id should be the user's id)
// (previously had upsertProfile; removed per user request)

export const logout = async () => {
  await getClient().auth.signOut();
};

export const deleteAccount = async () => {
  // Supabase does not allow user deletion from client; requires server-side.
  throw new Error('deleteAccount must be implemented server-side for Supabase');
};

// Remove default export that conflicts with named exports
// export default supabase as SupabaseClient;
