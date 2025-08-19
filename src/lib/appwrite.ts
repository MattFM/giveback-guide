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

export const logout = async () => {
    try {
        await account.deleteSession('current');
    } catch (error) {
        throw error;
    }
};
