// Simple runtime switch between Appwrite, Supabase, and PocketBase wrappers.
// Default to 'pocketbase' for new development. You can override by setting
// PUBLIC_AUTH_PROVIDER in your environment (e.g. to 'appwrite' or 'supabase').

const provider = (typeof import.meta !== 'undefined' ? (import.meta.env?.PUBLIC_AUTH_PROVIDER as string) : process.env.PUBLIC_AUTH_PROVIDER) || 'pocketbase';

let _impl: any = null;

async function loadImpl() {
  if (_impl) return _impl;
  if (provider === 'pocketbase') {
    _impl = await import('./pocketbase');
  } else {
    // Legacy Supabase provider for backwards compatibility
    _impl = await import('./supabase');
  }
  return _impl;
}

export async function getImpl() { return await loadImpl(); }

export const createMagicURLSession = async (...args: any[]) => {
  const m = await loadImpl();
  return m.createMagicURLSession(...args);
};

export const updateMagicURLSession = async (...args: any[]) => {
  const m = await loadImpl();
  if (typeof m.updateMagicURLSession !== 'function') throw new Error('updateMagicURLSession not implemented by provider');
  return m.updateMagicURLSession(...args);
};

export const getCurrentUser = async (...args: any[]) => {
  const m = await loadImpl();
  return m.getCurrentUser(...args);
};

export const updateAccountName = async (...args: any[]) => {
  const m = await loadImpl();
  return m.updateAccountName(...args);
};

export const updateAccountPreference = async (...args: any[]) => {
  const m = await loadImpl();
  return m.updateAccountPreference(...args);
};

export const logout = async (...args: any[]) => {
  const m = await loadImpl();
  return m.logout(...args);
};

export const deleteAccount = async (...args: any[]) => {
  const m = await loadImpl();
  return m.deleteAccount(...args);
};

export const account = async () => {
  const m = await loadImpl();
  return m.account;
};

// Remove the problematic default export that conflicts with named exports
// export default { getImpl };
