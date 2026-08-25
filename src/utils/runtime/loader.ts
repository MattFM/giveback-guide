declare global {
  interface Window {
    __bearnieUiBootPromise?: Promise<void>;
  }
}

export function ensureUiBootLoaded() {
  if (typeof window === "undefined") return;

  if (!window.__bearnieUiBootPromise) {
    window.__bearnieUiBootPromise = import("@/utils/runtime/ui-boot").then(
      ({ bootUiRuntime }) => {
        bootUiRuntime();
      }
    );
  }
}
