/**
 * Client-side Umami event helper.
 *
 * The Umami tracker is loaded with `defer`, so `window.umami` may not exist
 * yet on the first interaction. The optional call keeps that harmless rather
 * than throwing and losing the user's action.
 */

interface UmamiTracker {
    track: (event: string, data?: Record<string, string | number>) => void;
}

declare global {
    interface Window {
        umami?: UmamiTracker;
    }
}

export function trackEvent(
    event: string,
    data?: Record<string, string | number>,
): void {
    if (typeof window === "undefined") return;
    window.umami?.track(event, data);
}
