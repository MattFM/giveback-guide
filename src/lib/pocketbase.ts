import PocketBase from 'pocketbase';

// Lazy-initialize PocketBase to avoid crashing at module import time if envs are missing.
let _pb: PocketBase | null = null;

function readPublicEnv() {
  const url = typeof import.meta !== 'undefined' ? (import.meta.env?.PUBLIC_POCKETBASE_URL as string) : process.env.PUBLIC_POCKETBASE_URL;
  return url || '';
}

function getPB(): PocketBase {
  if (_pb) return _pb;
  const url = readPublicEnv();
  if (!url) {
    throw new Error('Pocketbase client not configured: PUBLIC_POCKETBASE_URL is missing');
  }
  _pb = new PocketBase(url);
  return _pb;
}

// Export the PocketBase client as a named export for use in other modules
export const pb = getPB;

// Provide an `account`-like object with minimal helpers used by the app
export const account = {
  // createJWT used by Workers endpoint in onboarding/profile
  async createJWT() {
    const token = getPB().authStore.token;
    if (!token) throw new Error('No session token available');
    return { jwt: token };
  },

  // Fallbacks for other direct account calls
  async get() {
    try {
      const record = getPB().authStore.record;
      if (!record) return null;
      
      // Normalize common fields for compatibility with Appwrite/Supabase-shaped user
      return {
        ...record,
        id: record.id,
        email: record.email,
        name: record.name || null,
        prefs: record.prefs || null,
      };
    } catch (e) {
      console.error('pocketbase account.get failed', e);
      return null;
    }
  },

  // createMagicURLSession -> pb.collection('users').requestOTP
  // Pocketbase requestOTP requires the user to exist. If they don't,
  // we create them first (same behaviour as Supabase signInWithOtp).
  async createMagicURLSession(email: string, redirectTo?: string) {
    try {
      console.debug('createMagicURLSession using redirectTo=', redirectTo);
      
      const pb = getPB();
      
      // Try to find the user by email
      let user = null;
      try {
        const result = await pb.collection('users').getList(1, 1, {
          filter: `email = "${email}"`,
        });
        if (result.items && result.items.length > 0) {
          user = result.items[0];
        }
      } catch (e) {
        // User not found, will create below
      }
      
      // If user doesn't exist, create them first
      if (!user) {
        console.debug('User not found, creating new user for', email);
        try {
          user = await pb.collection('users').create({
            email: email,
            emailVisibility: true,
            verified: false,
            password: 'temp-password-change-me-123!',
            passwordConfirm: 'temp-password-change-me-123!',
          });
          console.debug('Created new user:', user.id);
        } catch (createErr: any) {
          console.error('Failed to create user:', createErr);
          throw createErr;
        }
      }
      
      const resp = await pb.collection('users').requestOTP(email);
      console.debug('pocketbase.requestOTP response for', email, resp);
      
      return { data: resp, error: null };
    } catch (err: any) {
      console.error('createMagicURLSession failed', err);
      throw err;
    }
  },

  // delete session / logout
  async deleteSession() {
    getPB().authStore.clear();
    return true;
  }
};

// Helper functions mirroring the Appwrite wrapper surface
export const createMagicURLSession = async (email: string) => {
  return await account.createMagicURLSession(email);
};

export const updateMagicURLSession = async (otpId?: string, code?: string) => {
  try {
    console.debug('[updateMagicURLSession] Starting session verification...', { otpId: otpId ? 'provided' : 'none', code: code ? 'provided' : 'none' });
    
    if (!otpId || !code) {
      // Fallback: try to read from URL if not provided
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        otpId = otpId || urlParams.get('otpId') || undefined;
        code = code || urlParams.get('code') || undefined;
      }
    }
    
    if (!otpId || !code) {
      throw new Error('Missing OTP ID or code for authentication');
    }
    
    const authData = await getPB().collection('users').authWithOTP(otpId, code);
    console.debug('[updateMagicURLSession] authWithOTP result:', { 
      hasToken: !!authData?.token, 
      hasRecord: !!authData?.record 
    });
    
    if (authData?.record) {
      console.debug('[updateMagicURLSession] Session successfully established for user:', authData.record.email);
    }
    
    return { data: { session: authData }, error: null };
  } catch (e: any) {
    console.error('[updateMagicURLSession] Unexpected error:', e);
    throw e;
  }
};

export const getCurrentUser = async () => {
  try {
    // For static sites, check localStorage tokens and parse real user data
    if (typeof window !== 'undefined') {
      console.debug('[getCurrentUser] Checking localStorage for auth tokens...');
      
      // PocketBase stores auth in localStorage under the key 'pb_auth'
      const authToken = localStorage.getItem('pb_auth');
      
      if (authToken) {
        try {
          console.debug('[getCurrentUser] Attempting to parse auth token from pb_auth');
          const sessionData = JSON.parse(authToken);
          console.debug('[getCurrentUser] Parsed session data structure keys:', Object.keys(sessionData));
          
          // Extract record from session data (PocketBase format)
          const record = sessionData?.record;
          if (record) {
            console.debug('[getCurrentUser] Found user:', { id: record.id, email: record.email });
            
            return {
              ...record,
              id: record.id,
              email: record.email,
              name: record.name || null,
              prefs: record.prefs || null,
            };
          } else {
            console.warn('[getCurrentUser] No record found in session data. Available keys:', Object.keys(sessionData));
          }
        } catch (parseError) {
          console.error('[getCurrentUser] Failed to parse auth token:', parseError);
        }
      } else {
        console.warn('[getCurrentUser] No pb_auth token found in localStorage');
      }
      
      return null;
    }
    
    // Fallback to real PocketBase auth if in a server environment
    console.debug('[getCurrentUser] Not in browser context, using PocketBase client directly');
    const u = await account.get();
    console.debug('[getCurrentUser] PocketBase client returned:', u ? { id: u.id, email: u.email } : null);
    return u;
  } catch (e) {
    console.error('[getCurrentUser] Unexpected error:', e);
    return null;
  }
};

export const updateAccountName = async (name: string) => {
  const pb = getPB();
  const record = pb.authStore.record;
  if (!record) throw new Error('Not authenticated');

  console.debug('updateAccountName: current user before update', record);
  const resp = await pb.collection('users').update(record.id, { name });
  console.debug('updateAccountName response', resp);
  return true;
};

export const updateAccountPreference = async (key: string, value: any) => {
  const pb = getPB();
  const record = pb.authStore.record;
  if (!record) throw new Error('Not authenticated');
  
  const existingPrefs = record.prefs || {};
  const newPrefs = { ...existingPrefs, [key]: value };
  
  console.debug('updateAccountPreference payload', { prefs: newPrefs });
  const resp = await pb.collection('users').update(record.id, { prefs: newPrefs });
  console.debug('updateAccountPreference response', resp);
  return true;
};

export const logout = async () => {
  getPB().authStore.clear();
};

export const deleteAccount = async () => {
  const pb = getPB();
  const record = pb.authStore.record;
  if (!record) throw new Error('Not authenticated');
  
  await pb.collection('users').delete(record.id);
  pb.authStore.clear();
};

// Remove default export that conflicts with named exports
// export default pb;
