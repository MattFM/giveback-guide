import { Client, Account } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('giveback-guide')

export const account = new Account(client);

// Auth helper functions
export const createMagicURLSession = async (email: string) => {
    try {
        // Use the current origin in the browser (so localhost during dev).
        // Fall back to the production verify URL when running server-side.
        const redirectUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/auth/verify`
            : 'https://giveback.guide/auth/verify';

        await account.createMagicURLToken(
            'unique()',
            email,
            redirectUrl
        );
        return true;
    } catch (error) {
        throw error;
    }
};

export const getCurrentUser = async () => {
    try {
        const user = await account.get();
        return user;
    } catch (error) {
        return null;
    }
};

export const updateAccountName = async (name: string) => {
    try {
    // Try several common SDK method signatures to be resilient to differences
    const accAny = account as any;
    const errors: string[] = [];

    // 1) Common newer SDK: updateName(name)
    try {
        if (typeof accAny.updateName === 'function') {
            return await accAny.updateName(name);
        }
    } catch (e: any) {
        errors.push(`updateName(name) failed: ${e?.message || e}`);
    }

    // 2) Generic update object: update({ name })
    try {
        if (typeof accAny.update === 'function') {
            return await accAny.update({ name });
        }
    } catch (e: any) {
        errors.push(`update({name}) failed: ${e?.message || e}`);
    }

    // 3) Older variants: updateName(userId, name) or update({ userId, name })
    try {
        if (typeof accAny.updateName === 'function') {
            // try calling with two params in case signature expects userId first
            return await accAny.updateName(undefined, name);
        }
    } catch (e: any) {
        errors.push(`updateName(undefined, name) failed: ${e?.message || e}`);
    }

    // If none worked, throw useful diagnostic
    throw new Error(`Account update failed. Attempts: ${errors.join(' | ') || 'no methods available'}.`);
    } catch (error) {
        throw error;
    }
};

export const deleteAccount = async () => {
    try {
    // Deletes the currently logged-in user's account
    await (account as any).delete();
        return true;
    } catch (error) {
        throw error;
    }
};

export const updateAccountPreference = async (key: string, value: any) => {
    try {
        const accAny = account as any;

        // Try common patterns for updating preferences on different SDK versions
        const attempts: Array<() => Promise<any>> = [];

        // 1) updatePrefs({ key: value })
        attempts.push(async () => {
            if (typeof accAny.updatePrefs === 'function') return await accAny.updatePrefs({ [key]: value });
            throw new Error('updatePrefs not available');
        });

        // 2) update({ prefs: { key: value } })
        attempts.push(async () => {
            if (typeof accAny.update === 'function') return await accAny.update({ prefs: { [key]: value } });
            throw new Error('update not available');
        });

        // 3) updatePreferences or updatePrefs with two args
        attempts.push(async () => {
            if (typeof accAny.updatePreferences === 'function') return await accAny.updatePreferences({ [key]: value });
            if (typeof accAny.updatePrefs === 'function') return await accAny.updatePrefs(undefined, { [key]: value });
            throw new Error('no known prefs method');
        });

        const errors: string[] = [];
        for (const fn of attempts) {
            try {
                return await fn();
            } catch (e: any) {
                errors.push(e?.message || String(e));
            }
        }

        throw new Error(`Failed to update preference: ${errors.join(' | ')}`);
    } catch (err) {
        throw err;
    }
};

export const logout = async () => {
    try {
        await account.deleteSession('current');
    } catch (error) {
        throw error;
    }
};
