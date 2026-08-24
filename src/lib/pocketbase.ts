import PocketBase from 'pocketbase';

// Lazy-initialize PocketBase to avoid crashing at module import time if envs are missing.
let _pb: PocketBase | null = null;

// Session validation cache to avoid duplicate authRefresh calls within a single page load
let _cachedUser: any = null;
let _cacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds

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
  // For open beta support: try to create the user first if they don't exist.
  // Auth collections require a password field even when Password auth is disabled,
  // so we generate a random one. Users authenticate via OTP only.
  async createMagicURLSession(email: string, redirectTo?: string) {
    try {
      console.debug('createMagicURLSession using redirectTo=', redirectTo);
      
      const pb = getPB();
      
      // Try to create the user first (for new sign-ups)
      // Generate a random password — users never see or use it
      const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      try {
        await pb.collection('users').create({
          email: email,
          emailVisibility: true,
          verified: false,
          password: randomPassword,
          passwordConfirm: randomPassword,
        });
        console.debug('Created new user for', email);
      } catch (createErr: any) {
        // If user already exists, this is expected — ignore and proceed
        // PocketBase returns nested data: { data: { email: { code: 'validation_not_unique' } } }
        const responseData = createErr.data || createErr.response || {};
        const validationData = responseData.data || responseData;
        const emailError = validationData.email;
        const errorString = JSON.stringify(responseData);

        const isAlreadyExists = createErr.status === 400 && (
          createErr.message?.includes('already exists') ||
          emailError?.code === 'validation_not_unique' ||
          emailError?.code === 'validation_unique' ||
          (typeof emailError === 'string' && emailError.includes('unique')) ||
          createErr.message?.includes('Value must be unique') ||
          errorString.includes('validation_not_unique') ||
          errorString.includes('Value must be unique')
        );
        if (isAlreadyExists) {
          console.debug('User already exists:', email);
        } else {
          console.error('Unexpected error creating user:', createErr);
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
    const now = Date.now();
    if (_cachedUser && (now - _cacheTime) < CACHE_TTL) {
      console.debug('[getCurrentUser] Returning cached user');
      return _cachedUser;
    }

    if (typeof window === 'undefined') {
      // Server-side fallback
      console.debug('[getCurrentUser] Not in browser context, using PocketBase client directly');
      const u = await account.get();
      console.debug('[getCurrentUser] PocketBase client returned:', u ? { id: u.id, email: u.email } : null);
      return u;
    }

    console.debug('[getCurrentUser] Validating browser auth with server...');
    const pbClient = getPB();

    // Ensure authStore is populated from localStorage if the SDK hasn't auto-loaded yet
    if (!pbClient.authStore.token) {
      const authToken = localStorage.getItem('pocketbase_auth');
      if (authToken) {
        try {
          const sessionData = JSON.parse(authToken);
          if (sessionData.token && sessionData.record) {
            pbClient.authStore.save(sessionData.token, sessionData.record);
            console.debug('[getCurrentUser] Loaded auth from localStorage into authStore');
          } else {
            console.warn('[getCurrentUser] localStorage auth missing token or record');
            return null;
          }
        } catch (parseError) {
          console.error('[getCurrentUser] Failed to parse auth token:', parseError);
          return null;
        }
      } else {
        console.warn('[getCurrentUser] No pocketbase_auth token found in localStorage');
        return null;
      }
    }

    // Validate token with server via authRefresh
    try {
      const authData = await pbClient.collection('users').authRefresh();
      console.debug('[getCurrentUser] Token validated successfully:', {
        id: authData.record.id,
        email: authData.record.email,
      });

      const user = {
        ...authData.record,
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name || null,
        prefs: authData.record.prefs || null,
      };

      _cachedUser = user;
      _cacheTime = now;
      return user;
    } catch (refreshErr: any) {
      console.warn('[getCurrentUser] Token validation failed:', refreshErr.message || refreshErr);
      // Clear invalid session
      pbClient.authStore.clear();
      try {
        localStorage.removeItem('pocketbase_auth');
      } catch {}
      _cachedUser = null;
      _cacheTime = 0;
      return null;
    }
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
  _cachedUser = null;
  _cacheTime = 0;
};

export const deleteAccount = async () => {
  const pb = getPB();
  const record = pb.authStore.record;
  if (!record) throw new Error('Not authenticated');

  const userId = record.id;

  // 1. Delete user_item_status records (cascade delete is enabled, but explicit is safer)
  try {
    const statusRecords = await pb.collection('user_item_status').getFullList({
      filter: `user = "${userId}"`,
    });
    for (const item of statusRecords) {
      await pb.collection('user_item_status').delete(item.id);
    }
  } catch (e) {
    console.warn('No user_item_status records to delete or deletion failed', e);
  }

  // 2. Delete lists (list_items cascade-delete automatically because list_items.list has cascadeDelete: true)
  try {
    const lists = await pb.collection('lists').getFullList({
      filter: `user = "${userId}"`,
    });
    for (const list of lists) {
      await pb.collection('lists').delete(list.id);
    }
  } catch (e) {
    console.warn('No lists to delete or deletion failed', e);
  }

  // 3. Finally delete the user account
  await pb.collection('users').delete(userId);
  pb.authStore.clear();
  _cachedUser = null;
  _cacheTime = 0;
};

// Remove default export that conflicts with named exports
// export default pb;
