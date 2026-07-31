// Auth provider abstraction layer.
// All calls are delegated to the pocketbase implementation.

let _impl: any = null;

async function loadImpl() {
  if (_impl) return _impl;
  _impl = await import('./pocketbase');
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
