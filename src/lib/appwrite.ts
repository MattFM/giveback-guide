import { Client, Account } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('giveback-guide')

export const account = new Account(client);

// Auth helper functions
export const createMagicURLSession = async (email: string) => {
    try {
        await account.createMagicURLToken(
            'unique()',
            email,
            'https://giveback.guide/auth/verify' // Update this with your domain
        );
        return true;
    } catch (error) {
        throw error;
    }
};

export const createGoogleSession = async () => {
    try {
        const googleProvider = 'google' as any; // Type assertion for now
        await account.createOAuth2Session(
            googleProvider,
            'https://giveback.guide/auth/dashboard',
            'https://giveback.guide/auth/login'
        );
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
